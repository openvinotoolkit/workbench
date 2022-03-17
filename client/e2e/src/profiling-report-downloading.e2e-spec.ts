import { browser } from 'protractor';

import { IInferenceConfiguration } from '@shared/models/compound-inference-config';

import { InferenceType } from './pages/configuration-wizard.po';
import { TestUtils } from './pages/test-utils';
import { Helpers } from './pages/helpers';
import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';

describe('UI tests on Profiling Report Downloading', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  let analyticsPopup: AnalyticsPopup;
  const datasetFileImageNet = browser.params.precommit_scope.resources.imageNetDataset;
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
    datasetFileImageNet.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(datasetFileImageNet);
    helpers = new Helpers();
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  it('Upload FP16 IR V11 model, run parallel request tuning in CPU, download profiling report', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.squeezenetIRV11;
    modelFile.name = testUtils.helpers.generateName();
    await inferenceUtils.runInference(
      modelFile,
      datasetFileImageNet,
      InferenceType.CPU,
      browser.params.precommit_scope.resource_dir
    );

    const inferences: IInferenceConfiguration[] = [
      { batch: 2, nireq: 3 },
      { batch: 2, nireq: 5 },
      { batch: 2, nireq: 7 },
      { batch: 3, nireq: 3 },
      { batch: 3, nireq: 5 },
    ];

    const result = await inferenceUtils.runGroupInferenceFromConfigurationBlock(false, inferences);
    expect(result).toBeTruthy();

    const fileName = `${modelFile.name}_${datasetFileImageNet.name}_${TestUtils.targetNameFromEnum(
      InferenceType.CPU
    )}_report.csv`;
    await testUtils.downloadProfilingReport(fileName);
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
