import { browser } from 'protractor';

import { InferenceType } from './pages/configuration-wizard.po';
import { TestUtils } from './pages/test-utils';
import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';

describe('UI tests on Per-layer Report Downloading', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  const datasetFileImageNet = browser.params.precommit_scope.resources.imageNetDataset;

  beforeAll(async () => {
    testUtils = new TestUtils();
    inferenceUtils = new InferenceUtils(testUtils);
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await testUtils.analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();
    datasetFileImageNet.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(datasetFileImageNet);
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  it('Upload FP16 IR V11 model, run parallel request tuning in CPU, download per-layer report', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.squeezenetIRV11;
    modelFile.name = testUtils.helpers.generateName();
    await inferenceUtils.runInference(
      modelFile,
      datasetFileImageNet,
      InferenceType.CPU,
      browser.params.precommit_scope.resource_dir
    );

    const fileName = `${modelFile.name}_${datasetFileImageNet.name}_${TestUtils.targetNameFromEnum(
      InferenceType.CPU
    )}_stream_1_batch_1_report.csv`;
    await testUtils.downloadPerLayerReport(fileName);
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
