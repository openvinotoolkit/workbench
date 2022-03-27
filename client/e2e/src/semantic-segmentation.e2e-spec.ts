import { browser } from 'protractor';

import { OptimizationAlgorithm } from '@store/project-store/project.model';
import { ModelPrecisionEnum } from '@store/model-store/model.model';

import { InferenceType } from './pages/configuration-wizard.po';
import { Frameworks, TestUtils } from './pages/test-utils';
import { Helpers } from './pages/helpers';
import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';
import { CalibrationUtils } from './pages/calibration-utils';

// 52012
xdescribe('Semantic segmentation tests', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  let analyticsPopup: AnalyticsPopup;
  let calibrationUtils: CalibrationUtils;
  const dataSetFileSemantic = browser.params.precommit_scope.resources.smallSemanticSegmentationDataset;
  let helpers: Helpers;
  const precision = ModelPrecisionEnum.FP32;

  beforeAll(async () => {
    testUtils = new TestUtils();
    inferenceUtils = new InferenceUtils(testUtils);
    analyticsPopup = new AnalyticsPopup();
    calibrationUtils = new CalibrationUtils(testUtils);
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();
    // dataSetFileSemantic.name = testUtils.helpers.generateName();
    // await testUtils.uploadDataset(dataSetFileSemantic);
    helpers = new Helpers();
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await testUtils.deleteUploadedModels();
    await testUtils.uploadedModels.pop();
    await TestUtils.getBrowserLogs();
  });

  // TODO: 82461
  xit('Upload instance segmentation model (road-segmentation-adas-0001), check accuracy', async () => {
    const model = {
      name: 'road-segmentation-adas-0001',
      framework: 'openvino',
    };
    await calibrationUtils.runInt8PipelineThroughDownloader(
      model,
      dataSetFileSemantic,
      InferenceType.CPU,
      precision,
      OptimizationAlgorithm.ACCURACY_AWARE,
      10
    );
    const accuracy = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(model, true);
    console.log(`Accuracy check end: ${{ accuracy }}`);
  });

  // TODO: 70558, 82461
  xit('Upload instance segmentation model (deeplabv3), int8 calibration, check accuracy', async () => {
    const model = {
      name: 'deeplabv3',
      framework: Frameworks.TENSORFLOW,
    };
    await calibrationUtils.runInt8PipelineThroughDownloader(
      model,
      dataSetFileSemantic,
      InferenceType.CPU,
      precision,
      OptimizationAlgorithm.DEFAULT,
      10
    );
    const accuracy = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(model, true);
    console.log(`Accuracy check end: ${{ accuracy }}`);
  });

  afterAll(async () => {
    await testUtils.deleteUploadedDatasets();
    await TestUtils.getBrowserLogs();
  });
});
