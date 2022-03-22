import { browser } from 'protractor';

import { IInferenceConfiguration } from '@shared/models/compound-inference-config';

import { InferenceType } from './pages/configuration-wizard.po';
import { TestUtils } from './pages/test-utils';
import { Helpers } from './pages/helpers';
import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';

describe('UI tests on Running inference on VPU', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  let analyticsPopup: AnalyticsPopup;
  const datasetFileVOC = browser.params.precommit_scope.resources.smallVOCDataset;
  const datasetFileImageNet = browser.params.precommit_scope.resources.smallImageNetDataset;
  let helpers: Helpers;

  beforeAll(async () => {

    if (browser.params.isDevCloud) {
      jasmine.DEFAULT_TIMEOUT_INTERVAL *= 2.5;
    }
    await Helpers.setDevCloudCookies(browser.params.devCloudCookies);

    testUtils = new TestUtils();
    inferenceUtils = new InferenceUtils(testUtils);
    analyticsPopup = new AnalyticsPopup();
    helpers = new Helpers();
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();
    datasetFileVOC.name = testUtils.helpers.generateName();
    datasetFileImageNet.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(datasetFileImageNet);
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  it('Upload FP16 Classification model, upload ImageNet dataset, run VPU inference, check accuracy and model analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.squeezenetV1;
    const inferenceTarget = InferenceType.VPU;
    await inferenceUtils.runInferencePipelineThroughUpload(
      modelFile,
      datasetFileImageNet,
      inferenceTarget,
      null,
      null,
      browser.params.isDevCloud
    );

    const inferences: IInferenceConfiguration[] = [
      { batch: 2, nireq: 3 },
      { batch: 2, nireq: 6 },
      { batch: 3, nireq: 3 },
      { batch: 3, nireq: 6 },
      { batch: 4, nireq: 3 },
      { batch: 4, nireq: 6 },
    ];

    const result = await inferenceUtils.runGroupInferenceFromConfigurationBlock(false, inferences);
    expect(result).toBeTruthy();
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
