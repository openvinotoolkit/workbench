import { browser } from 'protractor';

import { InferenceType } from './pages/configuration-wizard.po';
import { Frameworks, TestUtils } from './pages/test-utils';
import { InferenceUtils } from './pages/inference-utils';
import { CalibrationUtils } from './pages/calibration-utils';
import { LoginPage } from './pages/login.po';

describe('UI tests on Advanced Accuracy Configuration', () => {
  const testUtils = new TestUtils();
  const inferenceUtils = new InferenceUtils(testUtils);
  const calibrationUtils = new CalibrationUtils(testUtils);
  const datasetFileVOC = browser.params.precommit_scope.resources.VOCDataset;
  const modelFile = browser.params.precommit_scope.resources.ODModels.ssdliteMobileNetV2;
  const inferenceTarget = InferenceType.CPU;

  beforeAll(async () => {
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await testUtils.analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();

    datasetFileVOC.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(datasetFileVOC);
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  it(
    'should create project with local model, go to advanced accuracy, check that accuracy is not available, ' +
      'check errors, go to basic, run accuracy, go to advanced accuracy again, check that accuracy measurement is available',
    async () => {
      modelFile.name = testUtils.helpers.generateName();

      await inferenceUtils.runInference(
        modelFile,
        datasetFileVOC,
        inferenceTarget,
        browser.params.precommit_scope.resource_dir
      );

      // Going to advanced accuracy
      await testUtils.advancedAccuracy.goToAccuracyConfiguration();
      await testUtils.advancedAccuracy.goFromBasicToAdvanced();
      expect(await testUtils.advancedAccuracy.isConfigurationValid()).toBeFalsy(
        'Advanced accuracy is valid but should not be.'
      );
      expect(await testUtils.advancedAccuracy.isSaveAccuracyButtonEnabled()).toBeFalsy();

      // Check that editor is filled with template
      const editorLines: string[] = await testUtils.advancedAccuracy.getCurrentConfigFromEditor();
      expect(editorLines.length).toBeGreaterThan(0);
      expect(editorLines.includes(`name: ${modelFile.name}`)).toBeTruthy();
      expect(editorLines.includes('launchers:')).toBeTruthy();
      expect(editorLines.includes('datasets:')).toBeTruthy();

      await testUtils.advancedAccuracy.toggleShowingErrors();
      expect(await testUtils.advancedAccuracy.areErrorsShown()).toBeTruthy('Errors are not shown.');

      expect(await testUtils.advancedAccuracy.getErrorMessageText('configuration')).toContain('is not supported');

      // Check accuracy
      await testUtils.advancedAccuracy.goFromAdvancedToBasic();
      await testUtils.advancedAccuracy.clickSaveAccuracy();
      await testUtils.clickElement(testUtils.accuracyReport.elements.createAccuracyReportButton);
      let accuracy: string = await testUtils.accuracyReport.waitAccuracyTaskAndGetAccuracyValue();

      expect(Number(accuracy)).toBeGreaterThanOrEqual(0);

      // Go to advanced accuracy again
      await testUtils.advancedAccuracy.goToAccuracyConfiguration();
      await testUtils.advancedAccuracy.goFromBasicToAdvanced();
      expect(await testUtils.advancedAccuracy.isConfigurationValid()).toBeTruthy(
        'Advanced accuracy is not valid but should be.'
      );
      await testUtils.advancedAccuracy.clickSaveAccuracy(true);
      accuracy = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile);
      expect(Number(accuracy)).toBeGreaterThanOrEqual(0);
    }
  );

  it(
    'should create project with model from OMZ, go to advanced accuracy, check that advanced is opened, ' +
      'check that config is valid and accuracy is available, run accuracy',
    async () => {
      const model = { name: 'ssd_mobilenet_v1_coco', framework: Frameworks.TENSORFLOW };

      // Download model
      await testUtils.modelManagerPage.openOMZTab();
      await testUtils.modelDownloadPage.filterTable(model.name);
      await testUtils.modelDownloadPage.downloadModel(model.name);
      await browser.sleep(1000);
      await testUtils.modelDownloadPage.convertDownloadedModelToIR('FP16');
      await browser.wait(
        () => testUtils.configurationWizard.isUploadReady(model.name),
        browser.params.defaultTimeout * 11
      );

      await inferenceUtils.runInferenceOnDownloadedModel(model.name, datasetFileVOC, inferenceTarget);

      // Go to accuracy
      await testUtils.advancedAccuracy.goToAccuracyConfiguration(true);
      // Check that advanced is opened
      expect(await testUtils.advancedAccuracy.isAdvancedAccuracyOpened()).toBeTruthy(
        'Not advanced accuracy is opened.'
      );
      // Check that config is valid
      expect(await testUtils.advancedAccuracy.isConfigurationValid()).toBeTruthy(
        'Advanced accuracy is not valid but should be.'
      );

      await testUtils.advancedAccuracy.clickSaveAccuracy(true);
      await browser.refresh();
      await browser.sleep(1000);
      const accuracy: string = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(model, true);

      expect(Number(accuracy)).toBeGreaterThan(0);
    }
  );

  it(
    'should create project with local model, run accuracy from basic, go to advanced, check that accuracy is available, ' +
      'type something into editor, check that accuracy is not available, check errors, go to basic, go to advanced, check accuracy',
    async () => {
      modelFile.name = testUtils.helpers.generateName();

      await inferenceUtils.runInference(
        modelFile,
        datasetFileVOC,
        inferenceTarget,
        browser.params.precommit_scope.resource_dir
      );

      // Go to basic accuracy, run accuracy
      await testUtils.advancedAccuracy.goToAccuracyConfiguration();
      await testUtils.advancedAccuracy.clickSaveAccuracy();
      await testUtils.clickElement(testUtils.accuracyReport.elements.createAccuracyReportButton);
      let accuracy: string = await testUtils.accuracyReport.waitAccuracyTaskAndGetAccuracyValue();

      expect(Number(accuracy)).toBeGreaterThanOrEqual(0);

      // Go to advanced accuracy
      await testUtils.advancedAccuracy.goToAccuracyConfiguration();
      await testUtils.advancedAccuracy.goFromBasicToAdvanced();
      expect(await testUtils.advancedAccuracy.isConfigurationValid()).toBeTruthy(
        'Advanced accuracy is not valid but should be.'
      );

      // Type something into editor
      await testUtils.advancedAccuracy.placeCursorAtTheEndOfTheEditor();
      await testUtils.advancedAccuracy.sendTextToEditor('some arbitrary text');

      // Check that accuracy is not available
      expect(await testUtils.advancedAccuracy.isConfigurationValid()).toBeFalsy(
        'Advanced accuracy is valid but should be.'
      );
      expect(await testUtils.advancedAccuracy.isSaveAccuracyButtonEnabled()).toBeFalsy();

      // Check error
      await testUtils.advancedAccuracy.toggleShowingErrors();
      expect(await testUtils.advancedAccuracy.getErrorMessageText('syntax')).toContain('block mapping entry');

      // Go to basic
      await testUtils.advancedAccuracy.goFromAdvancedToBasic();
      expect(await testUtils.advancedAccuracy.isSaveAccuracyButtonEnabled()).toBeTruthy();
      // Go to advanced again
      await testUtils.advancedAccuracy.goFromBasicToAdvanced();

      // Check that configuration is valid
      expect(await testUtils.advancedAccuracy.isConfigurationValid()).toBeTruthy(
        'Advanced accuracy is not valid but should be.'
      );
      expect(await testUtils.advancedAccuracy.isSaveAccuracyButtonEnabled()).toBeTruthy();

      // Check accuracy
      await testUtils.advancedAccuracy.clickSaveAccuracy(true);
      accuracy = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile);
      expect(Number(accuracy)).toBeGreaterThanOrEqual(0);
    }
  );

  // 52012
  xit('should create project with local model, run INT8, go to advanced accuracy, check that config is valid', async () => {
    modelFile.name = testUtils.helpers.generateName();

    await calibrationUtils.runInt8PipelineThroughUpload(modelFile, datasetFileVOC, inferenceTarget);

    // Go to accuracy
    await testUtils.advancedAccuracy.goToAccuracyConfiguration();
    expect(await testUtils.advancedAccuracy.isAdvancedAccuracyOpened()).toBeFalsy();

    await testUtils.advancedAccuracy.goFromBasicToAdvanced();
    // Check the state of advanced accuracy
    expect(await testUtils.advancedAccuracy.isConfigurationValid()).toBeTruthy();
    expect(await testUtils.advancedAccuracy.isSaveAccuracyButtonEnabled()).toBeTruthy();

    await testUtils.advancedAccuracy.clickSaveAccuracy(true);
    const accuracy = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile, false);
    expect(Number(accuracy)).toBeGreaterThanOrEqual(0);
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await testUtils.deleteUploadedModels();
    await testUtils.uploadedModels.pop();
    await TestUtils.getBrowserLogs();
  });

  afterAll(async () => {
    await testUtils.deleteUploadedDatasets();
    await TestUtils.getBrowserLogs();
  });
});
