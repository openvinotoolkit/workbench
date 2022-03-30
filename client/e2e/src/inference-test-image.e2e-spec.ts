import { browser, ElementFinder } from 'protractor';

import { ModelPrecisionEnum } from '@store/model-store/model.model';

import { InferenceType } from './pages/configuration-wizard.po';
import { Frameworks, TestUtils } from './pages/test-utils';
import { Helpers } from './pages/helpers';
import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';
import { VisualizeInferenceResultPage } from './pages/inference-test-image.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';

import { TargetMachines, DevCloudTargets } from './pages/target-machines.po';

describe('UI tests on Running inference', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  let analyticsPopup: AnalyticsPopup;
  let helpers: Helpers;
  let visualizeInferenceResultPage: VisualizeInferenceResultPage;
  const datasetFileVOC = browser.params.precommit_scope.resources.VOCDataset;
  const datasetFileImageNet = browser.params.precommit_scope.resources.imageNetDataset;
  const dataSetFileCoco = browser.params.precommit_scope.resources.cocoDataset;
  const dataSetFileSemantic = browser.params.precommit_scope.resources.CSSDataset;

  let targetRow;
  const targetMachines: TargetMachines = new TargetMachines();

  beforeAll(async () => {
    await Helpers.setDevCloudCookies(browser.params.devCloudCookies);

    testUtils = new TestUtils();
    inferenceUtils = new InferenceUtils(testUtils);
    analyticsPopup = new AnalyticsPopup();
    visualizeInferenceResultPage = new VisualizeInferenceResultPage();
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();

    if (browser.params.isDevCloud) {
      jasmine.DEFAULT_TIMEOUT_INTERVAL *= 2.5;
      targetRow = await targetMachines.getCellByPlatformTag(DevCloudTargets.CORE);
    }

    datasetFileVOC.name = testUtils.helpers.generateName();
    datasetFileImageNet.name = testUtils.helpers.generateName();
    dataSetFileCoco.name = testUtils.helpers.generateName();
    // dataSetFileSemantic.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(datasetFileVOC);
    await testUtils.uploadDataset(datasetFileImageNet);
    // await testUtils.uploadDataset(dataSetFileSemantic);
    await testUtils.uploadDataset(dataSetFileCoco);
    helpers = new Helpers();
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
    await browser.sleep(2000);
  });

  it('should create project with Classification model, upload image, test, check for predictions', async () => {
    const model = { name: 'squeezenet1.1', framework: Frameworks.CAFFE };
    const imageFile = browser.params.precommit_scope.resources.testImages.classificationImage;
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughDownloader(
      model,
      datasetFileImageNet,
      inferenceTarget,
      null,
      ModelPrecisionEnum.FP32,
      true,
      targetRow
    );

    await visualizeInferenceResultPage.selectTestRibbon();
    await visualizeInferenceResultPage.testImage(imageFile);
  });

  xit('should create project with Object Detection model, upload image, test, check for predictions', async () => {
    const model = { name: 'ssd_mobilenet_v1_coco', framework: Frameworks.TENSORFLOW };
    const imageFile = browser.params.precommit_scope.resources.testImages.ODImage;
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughDownloader(
      model,
      dataSetFileCoco,
      inferenceTarget,
      null,
      ModelPrecisionEnum.FP32,
      true,
      targetRow
    );

    await visualizeInferenceResultPage.selectTestRibbon();
    await visualizeInferenceResultPage.testImage(imageFile);
    await visualizeInferenceResultPage.checkForThresholdArea();
    await visualizeInferenceResultPage.checkImageLabel(0.9);
  });

  // TODO: 61182
  xit('should create project with Instance Segmentation model, upload image, test, check for predictions', async () => {
    const model = { name: 'mask_rcnn_inception_v2_coco', framework: Frameworks.TENSORFLOW };
    const imageFile = browser.params.precommit_scope.resources.testImages.instanceSegmImage;
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughDownloader(
      model,
      dataSetFileCoco,
      inferenceTarget,
      null,
      ModelPrecisionEnum.FP16,
      true,
      targetRow
    );

    await visualizeInferenceResultPage.selectTestRibbon();
    await visualizeInferenceResultPage.testImage(imageFile);
    await visualizeInferenceResultPage.checkForThresholdArea();
    await visualizeInferenceResultPage.checkImageLabel(0.9);
  });

  it('should create project with Semantic Segmentation model, upload image, test, check for predictions', async () => {
    const model = { name: 'semantic-segmentation-adas-0001', framework: 'openvino' };
    const imageFile = browser.params.precommit_scope.resources.testImages.semanticSegmImage;
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughDownloader(
      model,
      dataSetFileSemantic,
      inferenceTarget,
      null,
      ModelPrecisionEnum.FP16,
      true,
      targetRow
    );

    await visualizeInferenceResultPage.selectTestRibbon();
    await visualizeInferenceResultPage.testImage(imageFile);
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
