import { browser, protractor } from 'protractor';

import { InferenceType } from './pages/configuration-wizard.po';
import { LoginPage } from './pages/login.po';
import { TestUtils } from './pages/test-utils';
import { Helpers } from './pages/helpers';
import { InferenceUtils } from './pages/inference-utils';
import { CalibrationUtils } from './pages/calibration-utils';
import { AnalyticsPopup } from './pages/analytics-popup.po';

// 52012
xdescribe('UI tests on Running inference', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  let calibrationUtils: CalibrationUtils;
  let analyticsPopup: AnalyticsPopup;
  const datasetFileVOC = browser.params.precommit_scope.resources.smallVOCDataset;
  const datasetFileImageNet = browser.params.precommit_scope.resources.smallImageNetDataset;
  let helpers: Helpers;
  let until;

  beforeAll(async () => {
    testUtils = new TestUtils();
    inferenceUtils = new InferenceUtils(testUtils);
    calibrationUtils = new CalibrationUtils(testUtils);
    analyticsPopup = new AnalyticsPopup();
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();
    datasetFileVOC.name = testUtils.helpers.generateName();
    datasetFileImageNet.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(datasetFileVOC);
    await testUtils.uploadDataset(datasetFileImageNet);
    helpers = new Helpers();
    until = protractor.ExpectedConditions;
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  it('Run inference, int8 tuning and download int8 model', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.ssdliteMobileNetV2;
    const inferenceTarget = InferenceType.CPU;

    await calibrationUtils.runInt8PipelineThroughUpload(modelFile, datasetFileVOC, inferenceTarget);
    console.log('Accuracy check start');
    console.log('Run Int8 accuracy');
    await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile, false);
    console.log('Accuracy check end');
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
