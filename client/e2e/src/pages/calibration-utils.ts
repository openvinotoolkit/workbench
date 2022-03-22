import { browser, by, element, protractor } from 'protractor';

import {
  OptimizationAlgorithm,
  OptimizationAlgorithmPreset,
  OptimizationAlgorithmPresetNames,
} from '@store/project-store/project.model';

import { ModelManagerPage } from './model-manager.po';
import { ModelDownloadPage } from './model-download.po';
import { ConfigurationWizardPage, InferenceType, OptimizationType } from './configuration-wizard.po';
import { InferenceCardPage } from './inference-card.po';
import { CalibrationPage } from './calibration-configurator.po';
import { Frameworks, TestUtils } from './test-utils';
import { Helpers } from './helpers';
import { InferenceUtils } from './inference-utils';
import { TargetMachines } from './target-machines.po';

export class CalibrationUtils {
  inferenceCard: InferenceCardPage;
  inferenceUtils: InferenceUtils;
  configurationWizard: ConfigurationWizardPage;
  modelManagerPage: ModelManagerPage;
  modelDownloadPage: ModelDownloadPage;
  configurationForm: CalibrationPage;
  testUtils: TestUtils;
  helpers: Helpers;
  targetMachines: TargetMachines;
  until;

  constructor(originTestUtils?) {
    this.until = protractor.ExpectedConditions;
    originTestUtils ? (this.testUtils = originTestUtils) : (this.testUtils = new TestUtils());
    this.helpers = new Helpers();
    this.configurationWizard = new ConfigurationWizardPage();
    this.inferenceCard = new InferenceCardPage();
    this.modelDownloadPage = new ModelDownloadPage();
    this.modelManagerPage = new ModelManagerPage();
    this.configurationForm = new CalibrationPage();
    this.inferenceUtils = new InferenceUtils(originTestUtils);
    this.targetMachines = new TargetMachines();
  }

  async uploadCalibrationDataset(datasetFile, resourceDir) {
    // Assume that the current page is 'edit-calibration' page
    await this.testUtils.clickButton('import-calibration-dataset');
    datasetFile.name = this.helpers.generateName();

    // Verify external link pop-up
    await this.configurationWizard.expandDatasetTips();
    await new TestUtils().checkExternalLinkDialogWindow();

    await this.configurationWizard.selectDatasetFile(datasetFile, resourceDir);
    await browser.wait(
      this.until.elementToBeClickable(this.configurationWizard.uploadButton),
      browser.params.defaultTimeout
    );
    await this.configurationWizard.uploadButton.click();
    await browser.wait(
      () => this.configurationWizard.isUploadReady(datasetFile.name),
      browser.params.defaultTimeout * 10
    );
    this.testUtils.uploadedDatasets.push(datasetFile.name);
    await this.testUtils.configurationWizard.selectDatasetRow(datasetFile, true);
  }

  async checkDatasetInTable(datasetFile) {
    const datasetRow = element(by.css(`[data-test-id="datasets-table"] [data-test-id='row_name_${datasetFile.name}']`));
    return await datasetRow.isPresent();
  }

  async isInt8TuneReady() {
    const int8Result = await this.testUtils.waitForProjectToBeReady();
    if (!int8Result) {
      throw new Error('Calibration fail');
    }

    await browser.sleep(500);
    const isNumber = /(\d+(\.\d+)?)/.test(await this.inferenceCard.getFpsValue());

    console.log('finished inference after tuning');
    if (!(int8Result && isNumber)) {
      throw new Error('Fail inference after int8 tune');
    }
    return int8Result;
  }

  async runInt8PipelineThroughUpload(
    modelFile,
    datasetFile,
    inferenceTarget,
    algorithm: OptimizationAlgorithm = OptimizationAlgorithm.DEFAULT,
    preset: OptimizationAlgorithmPreset = OptimizationAlgorithmPreset.PERFORMANCE,
    remoteMachine?: string,
    subsetPercent = 100,
    shouldConfigureAccuracy: boolean = true,
    devCloud: boolean = false
  ) {
    modelFile.name = this.helpers.generateName();
    const levels = [OptimizationType.INT_8];
    await this.inferenceUtils.runInference(
      modelFile,
      datasetFile,
      inferenceTarget,
      browser.params.precommit_scope.resource_dir,
      false,
      remoteMachine,
      devCloud
    );
    await this.runCalibration(
      modelFile,
      datasetFile.name,
      inferenceTarget,
      levels,
      algorithm,
      subsetPercent,
      10,
      false,
      preset,
      remoteMachine,
      shouldConfigureAccuracy
    );
  }

  async runInt8PipelineThroughDownloader(
    modelFile,
    datasetFile,
    inferenceTarget = InferenceType.CPU,
    precision?,
    algorithm?: OptimizationAlgorithm,
    subsetPercent?,
    preset?: OptimizationAlgorithmPreset,
    accuracyDrop = 10,
    remoteMachine?: string,
    devCloud?: boolean
  ) {
    try {
      this.modelManagerPage.openOMZTab();

      const internetConnectionMessage = TestUtils.getElementByDataTestId('no-connect-message');
      if ((await internetConnectionMessage.isPresent()) && browser.params.isNightly) {
        return false;
      }

      await this.testUtils.modelDownloadPage.selectAndDownloadModel(modelFile.name);

      // TODO: 32321
      // Check links in model description
      // const detailsButton = await TestUtils.getElementByDataTestId('details');
      // await detailsButton.click();
      // await browser.sleep(700);
      // await this.testUtils.checkAnotherTabOpening();

      if (modelFile.framework !== Frameworks.OPENVINO) {
        const configurationMultiplier = browser.params.isNightly ? 5 : 3;
        await this.modelDownloadPage.convertDownloadedModelToIR(precision, configurationMultiplier);
      }

      await browser.wait(
        async () => await this.configurationWizard.isUploadReady(modelFile.name),
        browser.params.defaultTimeout * 9
      );

      await this.inferenceUtils.runInferenceOnDownloadedModel(
        modelFile.name,
        datasetFile,
        inferenceTarget,
        undefined,
        remoteMachine,
        devCloud
      );
      const levels = [OptimizationType.INT_8];
      await this.runCalibration(
        modelFile,
        datasetFile.name,
        inferenceTarget,
        levels,
        algorithm,
        subsetPercent,
        accuracyDrop,
        true,
        preset,
        remoteMachine,
        devCloud
      );
    } catch (e) {
      console.log(e);
      return this.testUtils.checkDownloadError(e);
    }
  }

  async runInt8Calibration(
    modelFile,
    datasetName,
    targetDevice,
    levels,
    algorithm: OptimizationAlgorithm,
    subsetPercent?,
    drop?,
    isOMZ?,
    preset?: OptimizationAlgorithmPreset,
    shouldConfigureAccuracy: boolean = true
  ): Promise<void> {
    await this.inferenceCard.selectInt8Tab();

    // TODO: 32321
    // Verify external link pop-up for INT8 docs
    // await new TestUtils().checkExternalLinkDialogWindow();
    // await console.log('Checking another tab opening.');
    // await new TestUtils().checkAnotherTabOpening();

    await this.testUtils.clickElement(this.inferenceCard.calibrate);
    await browser.sleep(2000);
    await browser.refresh();
    await browser.sleep(2000);
    // Verify external link pop-up for algorithms
    await new TestUtils().checkExternalLinkDialogWindow();

    if ((await browser.isElementPresent(this.configurationForm.configureAccuracy)) && shouldConfigureAccuracy) {
      await this.testUtils.clickElement(this.configurationForm.configureAccuracy);
      await this.modelManagerPage.configureAccuracySettings(modelFile.accuracyData);
      console.log('Accuracy settings filled');
    }

    if (subsetPercent) {
      await this.configurationForm.fillSubset(subsetPercent);
    }

    await browser.sleep(500);

    switch (algorithm) {
      case OptimizationAlgorithm.DEFAULT:
        await this.testUtils.clickElement(this.configurationForm.defaultAlgorithmOption);
        if (await this.configurationForm.configureAccuracy.isPresent()) {
          await browser.wait(
            this.until.presenceOf(this.configurationForm.configureAccuracy),
            browser.params.defaultTimeout
          );
          await this.configurationForm.configureAccuracy.click();
          await browser.wait(
            this.until.presenceOf(this.testUtils.modelManagerPage.saveAccuracyButton),
            browser.params.defaultTimeout
          );
          await this.testUtils.modelManagerPage.saveAccuracyButton.click();
        }
        await this.testUtils.clickElement(this.configurationForm.defaultAlgorithmOption);
        break;
      case OptimizationAlgorithm.ACCURACY_AWARE:
        await browser.wait(async () => {
          try {
            await this.configurationForm.accuracyAwareAlgorithmOption.click();
            return await this.configurationForm.int8AccuracyDrop.isPresent();
          } catch {
            return false;
          }
        }, browser.params.defaultTimeout);
        console.log('AccuracyAware select');
        if (await this.configurationForm.configureAccuracy.isPresent()) {
          await this.testUtils.clickElement(this.configurationForm.configureAccuracy);
          console.log('Open accuracy configuration');
          await this.modelManagerPage.configureAccuracySettings(modelFile.accuracyData);
          console.log('Accuracy settings filled second');
          await this.testUtils.clickElement(this.configurationForm.accuracyAwareAlgorithmOption);
        }
        await this.configurationForm.fillAccuracyDrop(drop);
        break;
    }

    await this.testUtils.configurationWizard.setInferenceTime.click();
    await console.log('Inference time is set to 4 sec.');

    if (preset) {
      await this.configurationForm.choosePreset(preset);
    }

    await this.testUtils.clickElement(this.configurationForm.calibrateBtn);
    await browser.sleep(500);
  }

  async runCalibration(
    modelFile,
    datasetName,
    targetDevice,
    levels,
    algorithm: OptimizationAlgorithm,
    subsetPercent?,
    drop?,
    isOMZ?,
    preset?: OptimizationAlgorithmPreset,
    remoteMachine?: string,
    shouldConfigureAccuracy: boolean = true
  ) {
    const calibrationSettings = {
      datasetName,
      calibrationType: algorithm === OptimizationAlgorithm.DEFAULT ? 'Default' : 'AccuracyAware',
      subsetPercent: subsetPercent || 100,
      drop: drop || 0.5,
      preset: preset
        ? OptimizationAlgorithmPresetNames[preset]
        : OptimizationAlgorithmPresetNames[OptimizationAlgorithmPreset.PERFORMANCE],
    };

    // Still on the original project page
    const parentProjectID: number = await this.testUtils.inferenceCard.getProjectID();
    const parentProjectURL: string = await browser.getCurrentUrl();

    await this.runInt8Calibration(
      modelFile,
      datasetName,
      targetDevice,
      levels,
      algorithm,
      subsetPercent,
      drop,
      isOMZ,
      preset,
      shouldConfigureAccuracy
    );

    if (!remoteMachine) {
      // TODO: remote when progress tracking is enabled. 36518
      await this.inferenceCard.waitForProgressBar();
    }

    await this.isInt8TuneReady().catch((err) => {
      console.log('Int-8 tune failed', err);
      throw new Error(`Int-8 tune failed: \n ${err}`);
    });
    // await this.testUtils.checkTuningSpeedup(1.15);

    // Now we should be on the calibrated project page: with different URL & project ID
    expect(parentProjectID).toBeLessThan(await this.testUtils.inferenceCard.getProjectID());
    expect(parentProjectURL === (await browser.getCurrentUrl())).toBeFalsy();

    await this.inferenceCard.openDetailsTab();

    if (isOMZ) {
      if (remoteMachine) {
        await browser.sleep(3000); // Wait for theoretical analysis to appear
      }
      await this.configurationWizard.validateOMZModelDetails();
    }

    await this.configurationWizard.validateCalibrationProperties(calibrationSettings);
  }

  async runCalibrationWithAccuracyCheck(modelFile, datasetFile, target, enableInt8?) {
    const levels = [OptimizationType.INT_8];
    const calibrationType = OptimizationAlgorithm.DEFAULT;

    await this.inferenceUtils.runInference(modelFile, datasetFile, target, browser.params.precommit_scope.resource_dir);

    let accuracy = await this.testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile);

    console.log(`Accuracy: ${accuracy}`);

    if (enableInt8) {
      await this.runCalibration(modelFile, datasetFile.name, target, levels, calibrationType, 10, 10, false);
      console.log(`Accuracy check end: ${{ accuracy }}`);
      console.log('Run Int8 accuracy');
      accuracy = await this.testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile, false);
      console.log(`Accuracy after int8: ${accuracy}`);
    }
  }
}
