import { browser } from 'protractor';

import { InferenceType } from './pages/configuration-wizard.po';
import { TestUtils } from './pages/test-utils';
import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';

describe('UI tests on Running inference', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  let analyticsPopup: AnalyticsPopup;
  const datasetFileVOC = browser.params.precommit_scope.resources.VOCDataset;

  beforeAll(async () => {
    testUtils = new TestUtils();
    inferenceUtils = new InferenceUtils(testUtils);
    analyticsPopup = new AnalyticsPopup();
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();
    datasetFileVOC.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(datasetFileVOC);
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  it('should upload H5 OD TensorFlow V2 model, run CPU inference, check accuracy and model analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.SimpleH5TF2;
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, datasetFileVOC, inferenceTarget);
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
