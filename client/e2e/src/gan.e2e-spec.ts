import { browser } from 'protractor';

import { OptimizationAlgorithm, OptimizationAlgorithmPreset } from '@store/project-store/project.model';

import { TestUtils } from './pages/test-utils';
import { AnalyticsPopup } from './pages/analytics-popup.po';
import { LoginPage } from './pages/login.po';
import { InferenceType } from './pages/configuration-wizard.po';
import { CalibrationUtils } from './pages/calibration-utils';

// 73930
xdescribe('Instance segmentation tests', () => {
  const testUtils: TestUtils = new TestUtils();
  const calibrationUtils: CalibrationUtils = new CalibrationUtils(testUtils);
  const analyticsPopup: AnalyticsPopup = new AnalyticsPopup();
  const dataSetFileCoco = browser.params.precommit_scope.resources.cocoDataset;
  const dataSetFileSuperRes = browser.params.precommit_scope.resources.superResolutionDataset;

  beforeAll(async () => {
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();
    dataSetFileCoco.name = testUtils.helpers.generateName();
    //dataSetFileSuperRes.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(dataSetFileCoco);
    //await testUtils.uploadDataset(dataSetFileSuperRes);
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  //TODO: 82461
  xit('Upload GAN model (single-image-super-resolution-1032), check accuracy, run calibration', async () => {
    const modelFile = browser.params.precommit_scope.resources.ganModels.singleImageSuperResolution1032;
    modelFile.name = testUtils.helpers.generateName();
    await calibrationUtils.runCalibrationWithAccuracyCheck(modelFile, dataSetFileSuperRes, InferenceType.CPU, true);
  });

  //TODO: 82461
  xit('Upload GAN model (text-image-super-resolution-0001), check accuracy, run calibration', async () => {
    const modelFile = browser.params.precommit_scope.resources.ganModels.textImageSuperResolution0001;
    modelFile.name = testUtils.helpers.generateName();
    await calibrationUtils.runCalibrationWithAccuracyCheck(modelFile, dataSetFileSuperRes, InferenceType.CPU, true);
  });

  // 56876
  xit('Upload GAN model (region-wise-inpainting), check accuracy, run calibration', async () => {
    const modelFile = browser.params.precommit_scope.resources.ganModels.regionWiseInpainting;
    modelFile.name = testUtils.helpers.generateName();
    await calibrationUtils.runCalibrationWithAccuracyCheck(modelFile, dataSetFileCoco, InferenceType.CPU, true);
  });

  it('Upload GAN model (itlab-mosaic), check accuracy, run calibration', async () => {
    const modelFile = browser.params.precommit_scope.resources.ganModels.itlabMosaic;
    modelFile.name = testUtils.helpers.generateName();
    await calibrationUtils.runCalibrationWithAccuracyCheck(modelFile, dataSetFileCoco, InferenceType.CPU, true);
  });

  it('Upload GAN model (fast-neural-style-mosaic-onnx), check accuracy, run calibration', async () => {
    const modelFile = browser.params.precommit_scope.resources.ganModels.fastNeuralStyleMosaicOnnx;
    modelFile.name = testUtils.helpers.generateName();
    await calibrationUtils.runCalibrationWithAccuracyCheck(modelFile, dataSetFileCoco, InferenceType.CPU, true);
  });

  //TODO: 82461
  xit('Upload GAN model (gmcnn-places2-tf), check accuracy, run calibration', async () => {
    const modelFile = browser.params.precommit_scope.resources.ganModels.gmcnnPlaces2;
    modelFile.name = testUtils.helpers.generateName();
    await calibrationUtils.runCalibrationWithAccuracyCheck(modelFile, dataSetFileSuperRes, InferenceType.CPU, true);
  });

  //TODO: 43320, 82461
  xit('Upload GAN model (tensor_layer_srgan), check accuracy, run calibration', async () => {
    const modelFile = browser.params.precommit_scope.resources.ganModels.tensorLayerSrgan;
    modelFile.name = testUtils.helpers.generateName();
    await calibrationUtils.runCalibrationWithAccuracyCheck(modelFile, dataSetFileSuperRes, InferenceType.CPU, true);
  });

  //TODO: 82461
  xit('Upload GAN model (tf-SRGAN), check accuracy, run calibration', async () => {
    const modelFile = browser.params.precommit_scope.resources.ganModels.tfSrGan;
    modelFile.name = testUtils.helpers.generateName();
    await calibrationUtils.runCalibrationWithAccuracyCheck(modelFile, dataSetFileSuperRes, InferenceType.CPU, true);
  });

  //TODO: 82461
  xit('Download GAN model (single-image-super-resolution-1032), check accuracy, run calibration', async () => {
    const model = { name: 'single-image-super-resolution-1032', framework: 'openvino' };
    await calibrationUtils.runInt8PipelineThroughDownloader(
      model,
      dataSetFileSuperRes,
      InferenceType.CPU,
      'FP32',
      OptimizationAlgorithm.DEFAULT,
      10,
      OptimizationAlgorithmPreset.PERFORMANCE
    );
  });

  afterEach(async () => {
    console.log(testUtils.uploadedModels);
    await TestUtils.takeScreenshot();
    await testUtils.deleteUploadedModels();
    testUtils.uploadedModels.pop();
    await TestUtils.getBrowserLogs();
  });

  afterAll(async () => {
    await testUtils.deleteUploadedDatasets();
  });
});
