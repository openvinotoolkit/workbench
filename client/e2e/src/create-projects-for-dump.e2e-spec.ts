import { browser } from 'protractor';

import { ModelPrecisionEnum } from '@store/model-store/model.model';

import { InferenceType } from './pages/configuration-wizard.po';
import { Frameworks, TestUtils } from './pages/test-utils';
import { Helpers } from './pages/helpers';
import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';

describe('UI testing of project creation and database dump', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  let analyticsPopup: AnalyticsPopup;
  const resources = browser.params.precommit_scope.resources;
  const datasetFileVOC = resources.VOCDataset;
  const datasetFileImageNet = resources.imageNetDataset;
  let helpers: Helpers;

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
    await testUtils.uploadDataset(datasetFileVOC);
    await testUtils.uploadDataset(datasetFileImageNet);
    helpers = new Helpers();
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  it('Upload OD model, run CPU inference, check accuracy', async () => {
    const modelFile = resources.ODModels.ssdliteMobileNetV2;

    await inferenceUtils.runInference(
      modelFile,
      datasetFileVOC,
      InferenceType.CPU,
      browser.params.precommit_scope.resource_dir
    );

    const accuracy = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile);
    expect(+accuracy).toBeTruthy();
  });

  it('should download Caffe2 model, run CPU inference, check info', async () => {
    const model = { name: 'squeezenet1.1', framework: Frameworks.CAFFE };
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughDownloader(
      model,
      datasetFileImageNet,
      inferenceTarget,
      null,
      ModelPrecisionEnum.FP32,
      true
    );
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });

  afterAll(async () => {
    await TestUtils.getBrowserLogs();
  });
});
