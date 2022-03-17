import { browser } from 'protractor';

import { ModelPrecisionEnum } from '@store/model-store/model.model';

import { InferenceType } from './pages/configuration-wizard.po';
import { Frameworks, TestUtils } from './pages/test-utils';
import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';

describe('UI tests for check migrations ', () => {
  const testUtils: TestUtils = new TestUtils();
  const inferenceUtils: InferenceUtils = new InferenceUtils(testUtils);
  const analyticsPopup: AnalyticsPopup = new AnalyticsPopup();
  const datasetFileVOC = browser.params.precommit_scope.resources.VOCDataset;
  const datasetFileImageNet = browser.params.precommit_scope.resources.smallImageNetDataset;

  beforeAll(async () => {
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.uploadDataset(datasetFileVOC);
    await testUtils.uploadDataset(datasetFileImageNet);
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  it('Upload IR model, run inference in CPU', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.ssdliteMobileNetV2;
    await inferenceUtils.runInference(
      modelFile,
      datasetFileVOC,
      InferenceType.CPU,
      browser.params.precommit_scope.resource_dir
    );
  });

  it('Upload model from origin framework, run inference in CPU', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.squeezenetV1;
    await inferenceUtils.runInference(
      modelFile,
      datasetFileImageNet,
      InferenceType.CPU,
      browser.params.precommit_scope.resource_dir
    );
  });

  it('Upload model from OMZ, run inference in CPU', async () => {
    const modelFile = { name: 'squeezenet1.1', framework: Frameworks.CAFFE };
    await inferenceUtils.runInferencePipelineThroughDownloader(
      modelFile,
      datasetFileImageNet,
      InferenceType.CPU,
      undefined,
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
