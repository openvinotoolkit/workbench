import { browser, by, ElementFinder, protractor } from 'protractor';

import { ProjectStatusNames } from '@store/project-store/project.model';

import { IInferenceConfiguration } from '@shared/models/compound-inference-config';

import { ModelManagerPage } from './model-manager.po';
import { ModelDownloadPage } from './model-download.po';
import {ConfigurationWizardPage, InferenceType} from './configuration-wizard.po';
import { InferenceCardPage } from './inference-card.po';
import { CalibrationPage } from './calibration-configurator.po';
import { TestUtils } from './test-utils';
import { Helpers } from './helpers';
import { InferenceConfigurationPage } from './inference-configuration-page';
import { ModelDashboardPage } from './model-dashboard.po';
import { TargetMachines, DevCloudTargets } from './target-machines.po';

export class InferenceUtils {
  modelDashboard: ModelDashboardPage;
  inferenceCard: InferenceCardPage;
  configurationWizard: ConfigurationWizardPage;
  modelManagerPage: ModelManagerPage;
  modelDownloadPage: ModelDownloadPage;
  ConfigurationForm: CalibrationPage;
  targetMachines: TargetMachines;
  inferenceConfigurationPage = new InferenceConfigurationPage();
  testUtils: TestUtils;
  helpers: Helpers;
  until;

  constructor(originTestUtils?) {
    this.until = protractor.ExpectedConditions;
    originTestUtils ? (this.testUtils = originTestUtils) : (this.testUtils = new TestUtils());
    this.helpers = new Helpers();
    this.configurationWizard = new ConfigurationWizardPage();
    this.inferenceCard = new InferenceCardPage();
    this.modelDashboard = new ModelDashboardPage();
    this.modelDownloadPage = new ModelDownloadPage();
    this.modelManagerPage = new ModelManagerPage();
    this.ConfigurationForm = new CalibrationPage();
    this.targetMachines = new TargetMachines();
  }

  async runInference(
    modelFile,
    datasetFile,
    targetDevice,
    resourceDir,
    isPerformanceComparison?,
    remoteMachine?: string,
    devCloud?: boolean
  ) {
    await this.modelManagerPage.selectUploadModelTab();
    await this.uploadModelByFramework(modelFile, resourceDir);

    await console.log('Upload is ready');
    await this.testUtils.configurationWizard.waitForModelsRows();

    await this.configurationWizard.checkModelType(modelFile.name);

    await this.configurationWizard.selectModelForInference(modelFile.name);
    this.testUtils.uploadedModels.push(modelFile.name);
    console.log(`Uploaded model: ${modelFile.name}`);

    if (remoteMachine) {
      await this.configurationWizard.selectEnvironmentStage();
      await this.testUtils.targetMachines.selectMachineRow(remoteMachine);
    }

    if (devCloud) {
      await this.configurationWizard.selectEnvironmentStage();
      const platform = targetDevice === InferenceType.VPU ? DevCloudTargets.MYRIAD : DevCloudTargets.CORE;
      const targetRow = await this.targetMachines.getCellByPlatformTag(platform);
      await browser.actions().mouseMove(targetRow).perform();
      await browser.sleep(1000);
      await targetRow.click();
    }

    await this.configurationWizard.selectDatasetRow(datasetFile);

    await this.configurationWizard.runInference(targetDevice, isPerformanceComparison);
    console.log('GO (inference) button clicked');

    await this.inferenceCard.waitForInferenceOverlay();
    return await this.testUtils.waitForProjectToBeReady();
  }

  async uploadModelByFramework(modelFile, resourceDir: string): Promise<void> {
    switch (modelFile.conversionSettings.framework) {
      case 'Caffe':
        await this.modelManagerPage.uploadCaffeModel(modelFile, resourceDir);
        break;
      case 'MxNet':
        await this.modelManagerPage.uploadMxNetModel(modelFile, resourceDir);
        break;
      case 'ONNX':
        await this.modelManagerPage.uploadOnnxModel(modelFile, resourceDir);
        break;
      case 'TensorFlow':
        await this.modelManagerPage.uploadTensorFlowModel(modelFile, resourceDir);
        break;
      case 'TensorFlow V2':
        await this.modelManagerPage.uploadTensorFlowV2Model(modelFile, resourceDir);
        break;
      default:
        await this.modelManagerPage.uploadIRModel(modelFile, resourceDir);
    }
  }

  async runInferenceNewTarget(name, datasetFile, newTargetDevice) {
    await this.inferenceCard.toModelPageBreadcrumb.click();
    await browser.sleep(1500);
    await this.modelDashboard.newProjectBtn.click();
    await this.configurationWizard.selectEnvironmentStage();
    const deviceName = TestUtils.targetNameFromEnumForWizard(newTargetDevice).toUpperCase();
    await TestUtils.getElementByDataTestId('device-select').click();
    await TestUtils.getElementByDataTestId(`device_${deviceName}`).click();

    await this.configurationWizard.selectDatasetRow(datasetFile);

    await this.configurationWizard.setInferenceTime.click();
    await this.configurationWizard.runInferenceButton.click();

    console.log('Wait second device inference');
    console.log('Wait done inference');
    await browser.wait(async () => {
      const waitResult = await this.testUtils.inferenceCard.isProjectReady();
      return waitResult === 'done';
    }, browser.params.defaultTimeout);
  }

  async runInferenceOnDownloadedModel(
    modelName,
    datasetFile,
    targetDevice,
    precision?,
    remoteMachine?: string,
    devCloud?: boolean
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        await browser.sleep(2000);
        await this.testUtils.configurationWizard.waitForModelsRows();
        await this.configurationWizard.selectModelForInference(modelName, precision);
        this.testUtils.uploadedModels.push(modelName);
        console.log(`Uploaded model: ${modelName}`);

        await this.configurationWizard.selectDatasetRow(datasetFile);

        if (remoteMachine) {
          await this.configurationWizard.selectEnvironmentStage();
          await this.testUtils.targetMachines.selectMachineRow(remoteMachine);
        }

        if (devCloud) {
          await this.configurationWizard.selectEnvironmentStage();
          const targetRow = await this.targetMachines.getCellByPlatformTag(DevCloudTargets.CORE);
          await browser.actions().mouseMove(targetRow).perform();
          await browser.sleep(1000);
          await targetRow.click();
        }

        await this.configurationWizard.runInference(targetDevice);
        await this.inferenceCard.waitForInferenceOverlay();
        const result = await this.testUtils.waitForProjectToBeReady();
        return result ? resolve(result) : reject(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  async runSingleInference(batch: number, streams: number): Promise<boolean> {
    await this.inferenceCard.runSingleInference(batch, streams);
    await this.inferenceCard.waitForInferenceOverlay();
    return await this.testUtils.waitForProjectToBeReady();
  }

  async runGroupInferenceFromConfigurationBlock(
    shouldCancel = false,
    inferenceConfig: IInferenceConfiguration[],
    reduceInferenceTime = true
  ) {
    return new Promise(async (resolve, reject) => {
      await this.inferenceCard.goToConfigureInferencePage();
      await this.inferenceConfigurationPage.runInferences(inferenceConfig, reduceInferenceTime);

      await this.inferenceCard.waitForInferenceOverlay();

      if (shouldCancel) {
        const res = await this.cancelGroupInference();
        return resolve(res);
      }

      const result = await this.testUtils.waitForProjectToBeReady();
      return result ? resolve(result) : reject(result);
    });
  }

  async runGroupInferenceChildProject(
    modelName,
    datasetName,
    targetDevice,
    inferenceConfig: IInferenceConfiguration[]
  ) {
    return new Promise(async (resolve, reject) => {
      await this.inferenceCard.goToConfigureInferencePage();
      await this.inferenceConfigurationPage.runInferences(inferenceConfig);

      await this.inferenceCard.waitForInferenceOverlay();
      const result = await this.testUtils.waitForProjectToBeReady();
      return result ? resolve(result) : reject(result);
    });
  }

  async cancelGroupInference() {
    // smooth inference progress implemented with rxjs delay function
    // which completely blocks protractor execution
    // in order to solve it "await browser.waitForAngularEnabled(false);" used here
    // docs: https://www.protractortest.org/#/timeouts
    await browser.waitForAngularEnabled(false);
    await browser.sleep(3000);
    const res = await new Promise(async (resolve, reject) => {
      do {
        try {
          const overlay = this.inferenceCard.runningInferenceOverlayEl;
          const cancel: ElementFinder = await overlay.all(by.css('[data-test-id="cancel-progress"]')).first();

          const isElementAvailable: boolean = await cancel.isPresent();
          if (!isElementAvailable) {
            console.log(`cancel button no longer exists`);
            throw new Error();
          }

          await new TestUtils().clickElement(cancel);
          console.log('clicked inference cancel');
          await this.testUtils.waitProjectStatus(ProjectStatusNames.CANCELLED);
          resolve(true);
          return true;
        } catch (e) {
          console.log(e);
          console.log(`received error for cancelling inference. try one more time.`);
        }
      } while (true);
    });
    await browser.waitForAngularEnabled(true);
    return res;
  }

  async runInferencePipelineThroughUpload(
    modelFile,
    datasetFile,
    inferenceTarget,
    isPerformanceComparison?, // TODO Remove unused flag
    remoteMachine?: string,
    isDevCloud: boolean = false
  ) {
    modelFile.name = this.helpers.generateName();
    await this.runInference(
      modelFile,
      datasetFile,
      inferenceTarget,
      browser.params.precommit_scope.resource_dir,
      isPerformanceComparison,
      remoteMachine,
      isDevCloud
    );
    return await this.testUtils.checkInferencePipeline(modelFile, datasetFile.name, inferenceTarget);
  }

  async runInferencePipelineThroughDownloader(
    model,
    datasetFile,
    inferenceTarget,
    batchSize?,
    precision?,
    isOmzModel?,
    devCloudTarget?,
    checkAccuracy = true
  ) {
    try {
      await this.modelManagerPage.openOMZTab();
      expect(browser.isElementPresent(this.modelDownloadPage.modelDownloadTable)).toBeTruthy();

      await this.modelDownloadPage.filterTable(model.name);

      // Verify external link pop-up
      const details = await TestUtils.getElementByDataTestId('details');
      await details.click();
      await browser.sleep(700);
      const omzInfoContainer = await TestUtils.getElementByDataTestId('omz-model-info');
      await new TestUtils().checkExternalLinkDialogWindow(omzInfoContainer);

      await this.modelDownloadPage.downloadModel(model.name, precision, model.framework);

      // Wait uploading model before go to the Prepare Environment tab
      const modelUploadPanel = await this.modelManagerPage.modelUploadPanel;

      if (model.framework !== 'openvino') {
        await browser.sleep(1000);
        await browser.wait(
          this.until.presenceOf(
            modelUploadPanel.all(by.className('status-bar-icon-ready')),
            browser.params.defaultTimeout * 10
          )
        );

        await browser.sleep(1000);
        await this.modelDownloadPage.convertDownloadedModelToIR(precision);
      }

      await browser.wait(() => this.configurationWizard.isUploadReady(model.name), browser.params.defaultTimeout * 11);
      console.log('Model was uploaded');

      if (devCloudTarget) {
        await this.configurationWizard.selectEnvironmentStage();
        await this.configurationWizard.selectPlatformRibbon();
        await browser.actions().mouseMove(devCloudTarget).perform();
        await browser.sleep(1000);
        await devCloudTarget.click();
      } else {
        await this.configurationWizard.showModelInfo();
        await this.configurationWizard.validateOMZModelDetails();
      }

      await this.runInferenceOnDownloadedModel(model.name, datasetFile, inferenceTarget, precision);
      return checkAccuracy
        ? await this.testUtils.checkInferencePipeline(
            model,
            datasetFile.name,
            inferenceTarget,
            isOmzModel,
            devCloudTarget
          )
        : undefined;
    } catch (e) {
      console.log(e);
      return this.testUtils.checkDownloadError(e);
    }
  }
}
