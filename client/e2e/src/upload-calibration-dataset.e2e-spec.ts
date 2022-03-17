import { browser, protractor } from 'protractor';

import { ConfigurationWizardPage, InferenceType } from './pages/configuration-wizard.po';
import { Helpers } from './pages/helpers';
import { Frameworks, TestUtils } from './pages/test-utils';
import { LoginPage } from './pages/login.po';
import { CalibrationUtils } from './pages/calibration-utils';
import { InferenceUtils } from './pages/inference-utils';
import { AnalyticsPopup } from './pages/analytics-popup.po';

describe('UI tests on Uploading Calibration Datasets', () => {
  let configurationWizard: ConfigurationWizardPage;
  let helpers: Helpers;
  let protractorUntil;
  let calibrationUtils: CalibrationUtils;
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  let analyticsPopup: AnalyticsPopup;
  const modelFile = { name: 'squeezenet1.1', framework: Frameworks.CAFFE };
  const modelFileGeneric = browser.params.precommit_scope.resources.classificationModels.squeezenetV1;
  const datasetFileVOC = browser.params.precommit_scope.resources.smallVOCDataset;
  const datasetFileImageNet = browser.params.precommit_scope.resources.smallImageNetDataset;
  const inferenceTarget = InferenceType.CPU;
  const resourcesDir = browser.params.precommit_scope.resource_dir;
  const originalDatasetName: string = datasetFileImageNet.name;

  beforeAll(async () => {
    configurationWizard = new ConfigurationWizardPage();
    helpers = new Helpers();
    testUtils = new TestUtils();
    analyticsPopup = new AnalyticsPopup();
    calibrationUtils = new CalibrationUtils(testUtils);
    inferenceUtils = new InferenceUtils(testUtils);
    protractorUntil = protractor.ExpectedConditions;
    await browser.get('/');
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();

    // Preparing model and validation dataset
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.uploadDataset(datasetFileImageNet);
    await testUtils.uploadDataset(datasetFileVOC);
    await testUtils.modelManagerPage.goToModelManager();

    await inferenceUtils.runInferencePipelineThroughDownloader(
      modelFile,
      datasetFileImageNet,
      inferenceTarget,
      undefined,
      undefined,
      true
    );
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
  });

  it('should upload calibration dataset, check that it is in table', async () => {
    // Navigation
    await testUtils.homePage.openProjectByModelAndDatasetNames(modelFile.name, originalDatasetName);
    await testUtils.inferenceCard.selectInt8Tab();
    await testUtils.clickElement(testUtils.inferenceCard.calibrate);

    await calibrationUtils.uploadCalibrationDataset(datasetFileImageNet, resourcesDir);
    expect(await calibrationUtils.checkDatasetInTable(datasetFileImageNet)).toBeTruthy();
  });

  it(
    'should upload incompatible calibration dataset, check that it is in table, check that "Optimize" button is disabled, ' +
      'refresh page, check that incompatible dataset is not present in the table',
    async () => {
      // Navigation
      await testUtils.homePage.openProjectByModelAndDatasetNames(modelFile.name, originalDatasetName);
      await testUtils.inferenceCard.selectInt8Tab();
      await testUtils.clickElement(testUtils.inferenceCard.calibrate);

      await calibrationUtils.uploadCalibrationDataset(datasetFileVOC, resourcesDir);
      expect(await calibrationUtils.checkDatasetInTable(datasetFileVOC)).toBeTruthy();
      expect(await calibrationUtils.configurationForm.calibrateBtn.isEnabled()).toBeTruthy();
      await browser.refresh();
      await browser.sleep(700);
      expect(await calibrationUtils.checkDatasetInTable(datasetFileVOC)).toBeFalsy();
    }
  );

  it('should check that "Cancel" and "Back ..." on the calibration dataset uploading return to the "Edit Calibration" page', async () => {
    // Navigation
    await testUtils.homePage.openProjectByModelAndDatasetNames(modelFile.name, originalDatasetName);
    await testUtils.inferenceCard.selectInt8Tab();
    await testUtils.clickElement(testUtils.inferenceCard.calibrate);

    await calibrationUtils.testUtils.clickButton('import-calibration-dataset');
    await calibrationUtils.testUtils.clickButton('cancel-button');
    expect(await browser.getCurrentUrl()).toContain('/edit-calibration/');

    await calibrationUtils.testUtils.clickButton('import-calibration-dataset');
    await calibrationUtils.testUtils.clickElement(await testUtils.configurationForm.toProjectsByModelButton);
    expect(await browser.getCurrentUrl()).toContain('/');
  });

  xit('should delete all compatible datasets, check that "Configuration Wizard" page is opened', async () => {
    // TODO: If validation dataset is deleted - user is forced to the "Configuration Wizard" - 27333

    // Navigation
    await testUtils.homePage.openProjectByModelAndDatasetNames(modelFile.name, originalDatasetName);
    await testUtils.inferenceCard.selectInt8Tab();
    await testUtils.clickElement(testUtils.inferenceCard.calibrate);

    // Deleting datasets from "edit-calibration" page
    await testUtils.configurationWizard.deleteUploadedFile(await testUtils.uploadedDatasets.shift());
    await testUtils.configurationWizard.deleteUploadedFile(await testUtils.uploadedDatasets.shift());
    expect(await browser.getCurrentUrl()).toContain('/projects/create');
  });

  it(
    'should check presence of "Configure Accuracy" message for model of Generic Type, configure accuracy, ' +
      'check "clash" case',
    async () => {
      // Navigation
      await testUtils.homePage.openConfigurationWizard();
      await testUtils.modelManagerPage.goToModelManager();

      // Preparing Generic model
      await inferenceUtils.runInference(
        modelFileGeneric,
        datasetFileVOC,
        inferenceTarget,
        browser.params.precommit_scope.resource_dir
      );

      // Opening "edit-configuration" page
      await testUtils.inferenceCard.selectInt8Tab();
      await testUtils.clickElement(testUtils.inferenceCard.calibrate);

      await calibrationUtils.configurationForm.accuracyAwareAlgorithmOption.click();

      expect(await calibrationUtils.configurationForm.configureAccuracy.isPresent()).toBeTruthy();
      await console.log('"Configure Accuracy" message is present.');

      // Configuring accuracy
      await browser.wait(
        protractorUntil.presenceOf(calibrationUtils.configurationForm.configureAccuracy),
        browser.params.defaultTimeout
      );
      await calibrationUtils.configurationForm.configureAccuracy.click();

      // Checking that "Clash" case is happening - prompts to choose another configuration
      expect(await calibrationUtils.configurationForm.chooseAnotherConfig.isPresent()).toBeTruthy();
    }
  );

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });

  afterAll(async () => {
    await testUtils.deleteArtifacts();
  });
});
