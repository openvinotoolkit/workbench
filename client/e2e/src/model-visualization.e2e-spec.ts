import { browser, ElementFinder, protractor } from 'protractor';

import { ModelPrecisionEnum } from '@store/model-store/model.model';

import { Frameworks, TestUtils } from './pages/test-utils';

import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';
import { InferenceType } from './pages/configuration-wizard.po';
import { VisualizeInferenceResultPage } from './pages/inference-test-image.po';

describe('UI tests on Model visualization', () => {
  const testUtils = new TestUtils();
  const until = protractor.ExpectedConditions;
  const inferenceUtils = new InferenceUtils(testUtils);
  const visualizeInferenceResultPage = new VisualizeInferenceResultPage();
  const inferenceTarget = InferenceType.CPU;

  const runInferenceAndSetImageAndSetThreshold = async (
    model: { name: string },
    dataset,
    imageFile: { pathToImage: string },
    threshold?: string,
    checkPredictionsTable?: boolean
  ) => {
    await inferenceUtils.runInferencePipelineThroughDownloader(
      model,
      dataset,
      inferenceTarget,
      null,
      ModelPrecisionEnum.FP16,
      true
    );

    await visualizeInferenceResultPage.selectVisualizeOutputTabAndCheckConfigContainer(true);
    await visualizeInferenceResultPage.testImage(imageFile, checkPredictionsTable);

    if (threshold) {
      await visualizeInferenceResultPage.checkForThresholdArea();
      await visualizeInferenceResultPage.setThreshold(threshold);
    }
  };

  const { helpers, analyticsPopup, homePage, modelManagerPage } = testUtils;
  const { resources, resource_dir, defaultTimeout } = browser.params.precommit_scope;
  const { cocoDataset, CSSDataset, smallVOCDataset, imageNetDataset, superResolutionDataset } = resources;

  beforeAll(async () => {
    await homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();

    await homePage.openConfigurationWizard();
    const datasetNames = ['cocoDataset', 'CSSDataset', 'smallVOCDataset', 'imageNetDataset', 'superResolutionDataset'];
    for (const datasetName of datasetNames) {
      const dataset = resources[datasetName];
      if (dataset) {
        dataset.name = helpers.generateName();
        await testUtils.uploadDataset(dataset);
      }
    }
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await homePage.openConfigurationWizard();
    await modelManagerPage.goToModelManager();
    await browser.sleep(1000);
  });

  // TODO: 69338
  xit('should check visualization OD SSD person-detection-0200 model', async () => {
    const model = { name: 'person-detection-0200', framework: 'openvino' };
    const imageFile = browser.params.precommit_scope.resources.testImages.personImage;
    const expectedImageFile = browser.params.precommit_scope.resources.testImages.personDetectionImageExpected;

    await runInferenceAndSetImageAndSetThreshold(model, cocoDataset, imageFile, '0.2');
    await visualizeInferenceResultPage.comparePredictionsAndBadgesWithExpectations(model, expectedImageFile, '0', 2);
  });

  it('should check visualization OD Yolo yolo-v1-tiny-tf model', async () => {
    const model = { name: 'yolo-v1-tiny-tf', framework: Frameworks.TENSORFLOW };
    const imageFile = browser.params.precommit_scope.resources.testImages.personImage;
    const expectedImageFile = browser.params.precommit_scope.resources.testImages.personImageYoloExpected;

    await runInferenceAndSetImageAndSetThreshold(model, smallVOCDataset, imageFile, '0.6');
    await visualizeInferenceResultPage.comparePredictionsAndBadgesWithExpectations(
      model,
      expectedImageFile,
      '14',
      1,
      {},
      'yolo-v1-tiny-tf'
    );
  });

  it('should check visualization Classification googlenet-v4-tf model', async () => {
    const model = { name: 'googlenet-v4-tf' };
    const imageFile = browser.params.precommit_scope.resources.testImages.streetImage;

    await runInferenceAndSetImageAndSetThreshold(model, imageNetDataset, imageFile);

    const tableRows = await visualizeInferenceResultPage.predictionTableItems;

    expect(tableRows.length).toEqual(5, 'Count of prediction should be equal 5');

    const expectedClasses = ['469', '921'];
    const result = await visualizeInferenceResultPage.arePredictionsEqualToExpectations(
      'prediction-class',
      expectedClasses,
      2
    );

    expect(result).toBeTruthy('Prediction classes should be equal');
  });

  // TODO: 61182
  xit('should check visualization Instance Segmentation mask_rcnn_inception_v2_coco model', async () => {
    const model = { name: 'mask_rcnn_inception_v2_coco' };
    const imageFile = browser.params.precommit_scope.resources.testImages.streetImage;
    const expectedImageFile = browser.params.precommit_scope.resources.testImages.instanceSegmExpected;

    await runInferenceAndSetImageAndSetThreshold(model, cocoDataset, imageFile, '0.8');

    await visualizeInferenceResultPage.comparePredictionsAndBadgesWithExpectations(model, expectedImageFile, '3', 4);
  });
  // TODO: 73934
  xit('should check visualization Semantic Segmentation semantic-segmentation-adas-0001 model', async () => {
    const model = { name: 'semantic-segmentation-adas-0001', framework: 'openvino' };
    const imageFile = browser.params.precommit_scope.resources.testImages.streetImage;
    const expectedImageFile = browser.params.precommit_scope.resources.testImages.semanticSegmExpected;

    await runInferenceAndSetImageAndSetThreshold(model, CSSDataset, imageFile);

    const expectedClasses = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '10', '11', '13'];
    await visualizeInferenceResultPage.comparePredictionsAndBadgesWithExpectations(
      model,
      expectedImageFile,
      expectedClasses,
      expectedClasses.length,
      { threshold: 0.5 }
    );
  });

  // 75981
  xit('should check visualization GAN single-image-super-resolution-1032 model', async () => {
    const model = { name: 'single-image-super-resolution-1032', framework: 'openvino' };
    const imageFile = browser.params.precommit_scope.resources.testImages.streetImage;

    await runInferenceAndSetImageAndSetThreshold(model, superResolutionDataset, imageFile, undefined, false);

    const resultCanvas: ElementFinder = await visualizeInferenceResultPage.resultCanvas;
    await browser.wait(until.presenceOf(resultCanvas), defaultTimeout);

    const { width, height } = await testUtils.getPngWithMetadataFromCanvas(resultCanvas);
    const { width: originalWidth, height: originalHeight } = await testUtils.getPngWithMetadataFromPath(imageFile);

    expect(width / originalWidth === 4 && height / originalHeight === 4).toBeTruthy(
      'Width and height should be 4 times larger'
    );
  });
  // TODO: Waiting for 52416
  xit('should check visualization GAN inpainting gmcnn-places2-tf model', async () => {
    const model = { name: 'gmcnn-places2-tf', framework: Frameworks.TENSORFLOW };

    await inferenceUtils.runInferencePipelineThroughDownloader(
      model,
      imageNetDataset,
      inferenceTarget,
      null,
      ModelPrecisionEnum.FP16,
      true
    );

    const imageFile = browser.params.precommit_scope.resources.testImages.streetImage;
    const expectedImageFile = browser.params.precommit_scope.resources.testImages.inpaintingImageExpected;

    await visualizeInferenceResultPage.selectVisualizeOutputTabAndCheckConfigContainer(true);
    await visualizeInferenceResultPage.uploadTestImage(imageFile);

    const paintingCanvas: ElementFinder = await TestUtils.getElementByDataTestId('painting-canvas');
    const imageCanvas: ElementFinder = await TestUtils.getElementByDataTestId('image-canvas');
    await browser.wait(until.presenceOf(paintingCanvas), browser.params.defaultTimeout);
    await browser.wait(until.presenceOf(imageCanvas), browser.params.defaultTimeout);
    // timeout for painting action
    await browser.sleep(4000);
    await browser
      .actions()
      .mouseMove(paintingCanvas, { x: 260, y: 100 })
      .mouseDown()
      .mouseMove(paintingCanvas, { x: 300, y: 240 })
      .mouseUp()
      .perform();
    // timeout for correct upload image
    await browser.sleep(4000);

    await testUtils.clickElement(visualizeInferenceResultPage.testImageBtn);

    const areImagesDifferent: boolean = await visualizeInferenceResultPage.isCanvasDifferentFromReference(
      expectedImageFile,
      model
    );
    expect(areImagesDifferent).toBeFalsy('Images should be equal');
  });

  it('should check visualization GAN fast-neural-style-mosaic-onnx model', async () => {
    const model = { name: 'fast-neural-style-mosaic-onnx' };
    const imageFile = browser.params.precommit_scope.resources.testImages.streetImage;
    const expectedImageFile = browser.params.precommit_scope.resources.testImages.styleTransferImageExpected;

    await runInferenceAndSetImageAndSetThreshold(model, cocoDataset, imageFile, undefined, false);

    const isImagesDifferent = await visualizeInferenceResultPage.isCanvasDifferentFromReference(
      expectedImageFile,
      model
    );
    expect(isImagesDifferent).toBeFalsy('Images should be equal');
  });

  // 73802
  xit('Should visualization form for Classification model', async () => {
    const model = resources.classificationModels.squeezenetINT8;
    model.name = helpers.generateName();
    await inferenceUtils.runInference(model, cocoDataset, InferenceType.CPU, resource_dir);
    await visualizeInferenceResultPage.selectVisualizeOutputTabAndCheckConfigContainer();

    await visualizeInferenceResultPage.fillVisualizationConfigurationField(
      modelManagerPage.usageContainer,
      model.accuracyData.adapter.taskType,
      'Task type'
    );
    const imageFile = resources.testImages.streetImage;
    await visualizeInferenceResultPage.testImage(imageFile);
    const tableRows = await visualizeInferenceResultPage.predictionTableItems;

    expect(tableRows.length).toEqual(5, 'Count of prediction should be equal 5');

    const expectedClasses = ['829', '468', '920', '569', '498'];
    const result = await visualizeInferenceResultPage.arePredictionsEqualToExpectations(
      'prediction-class',
      expectedClasses
    );

    expect(result).toBeTruthy('Prediction classes should be equal');
  });

  afterAll(async () => {
    await testUtils.deleteUploadedDatasets();
    await testUtils.deleteUploadedModels();
    await testUtils.uploadedModels.pop();
    await TestUtils.getBrowserLogs();
  });
});
