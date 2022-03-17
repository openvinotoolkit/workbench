import { browser } from 'protractor';

import { OptimizationAlgorithm } from '@store/project-store/project.model';

import { TestUtils } from './pages/test-utils';
import { InferenceUtils } from './pages/inference-utils';
import { AnalyticsPopup } from './pages/analytics-popup.po';
import { Helpers } from './pages/helpers';
import { LoginPage } from './pages/login.po';
import { InferenceType } from './pages/configuration-wizard.po';
import { CalibrationUtils } from './pages/calibration-utils';

describe('Instance segmentation tests', () => {
  let testUtils: TestUtils;
  let calibrationUtils: CalibrationUtils;
  let inferenceUtils: InferenceUtils;
  let analyticsPopup: AnalyticsPopup;
  const dataSetFileCoco = browser.params.precommit_scope.resources.cocoDataset;
  let helpers: Helpers;
  const precision = 'FP16';

  beforeAll(async () => {
    console.log(jasmine.DEFAULT_TIMEOUT_INTERVAL);
    testUtils = new TestUtils();
    calibrationUtils = new CalibrationUtils(testUtils);
    inferenceUtils = new InferenceUtils(testUtils);
    analyticsPopup = new AnalyticsPopup();
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();
    dataSetFileCoco.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(dataSetFileCoco);
    helpers = new Helpers();
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  // 71053
  xit('Upload instance segmentation model (mask_rcnn_inception_v2_coco), check accuracy', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.maskRcnnInceptionV2Coco;
    modelFile.name = testUtils.helpers.generateName();
    await calibrationUtils.runCalibrationWithAccuracyCheck(modelFile, dataSetFileCoco, InferenceType.CPU);
  });

  // 53056
  xit('Upload instance segmentation model (instance-segmentation-security-1040), check accuracy', async () => {
    const model = {
      name: 'instance-segmentation-security-1040',
      framework: 'openvino',
    };
    await calibrationUtils.runInt8PipelineThroughDownloader(
      model,
      dataSetFileCoco,
      InferenceType.CPU,
      precision,
      OptimizationAlgorithm.DEFAULT,
      10
    );
    const accuracy = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(model, true);
    console.log(`Accuracy check end: ${{ accuracy }}`);
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
