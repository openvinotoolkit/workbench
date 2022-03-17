import { browser } from 'protractor';

import { ModelPrecisionEnum } from '@store/model-store/model.model';

import { InferenceType } from './pages/configuration-wizard.po';
import { Frameworks, TestUtils } from './pages/test-utils';
import { Helpers } from './pages/helpers';
import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';

// 73803
xdescribe('UI tests on Running GPU inference', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  let analyticsPopup: AnalyticsPopup;
  let helpers: Helpers;
  const datasetFileImageNet = browser.params.precommit_scope.resources.smallImageNetDataset;
  const referenceLayerDistribution = browser.params.precommit_scope.resources.layersDistribution.inceptionResnetV2;

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
    datasetFileImageNet.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(datasetFileImageNet);
    helpers = new Helpers();
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  it('Upload FP16 Classification model, run GPU inference, check accuracy and model analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.inceptionResnetV2;
    const inferenceTarget = InferenceType.GPU;
    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, datasetFileImageNet, inferenceTarget);

    await testUtils.inferenceCard.checkLayerDistribution(referenceLayerDistribution);
  });

  it('should download FP32 model, run GPU inference, check advising logic', async () => {
    const modelFile = { name: 'squeezenet1.1-caffe2', framework: Frameworks.CAFFE2 };
    const inferenceTarget = InferenceType.GPU;
    await inferenceUtils.runInferencePipelineThroughDownloader(
      modelFile,
      datasetFileImageNet,
      inferenceTarget,
      undefined,
      ModelPrecisionEnum.FP32,
      true
    );

    const adviceCheckingParams = {
      adviceLevel: 0,
      isTheoryPresent: true,
      numberOfAdviceContainers: 1,
      adviceId: 'goToFP16',
    };

    await testUtils.inferenceCard.checkAdvice(adviceCheckingParams);
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
