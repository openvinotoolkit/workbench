import { browser, by, element, ElementFinder, protractor } from 'protractor';

import { TestUtils } from './pages/test-utils';
import { LoginPage } from './pages/login.po';
import { InferenceUtils } from './pages/inference-utils';
import { InferenceType } from './pages/configuration-wizard.po';
import { VisualizeInferenceResultPage } from './pages/inference-test-image.po';
import { TargetMachines, DevCloudTargets } from './pages/target-machines.po';
import { Helpers } from './pages/helpers';

describe('UI tests on visualization for model with not annotated dataset', () => {
  const testUtils = new TestUtils();
  const inferenceUtils = new InferenceUtils(testUtils);
  const visualizeInferenceResultPage = new VisualizeInferenceResultPage();
  const until = protractor.ExpectedConditions;
  const { homePage, analyticsPopup, helpers, modelManagerPage } = testUtils;
  const { resources, resource_dir } = browser.params.precommit_scope;
  const { ODModels, classificationModels, ganModels, imageNetNotAnnotated, testImages } = resources;

  let targetRow;
  const targetMachines: TargetMachines = new TargetMachines();

  const runInferenceOnModelAndGoToVisualizationTab = async (model) => {
    model.name = helpers.generateName();
    await inferenceUtils.runInference(model, imageNetNotAnnotated, InferenceType.CPU, resource_dir);
    await visualizeInferenceResultPage.selectVisualizeOutputTabAndCheckConfigContainer();
  };

  const testImageAndSetThreshold = async (imageFile: { pathToImage: string }, threshold: string, checkTable = true) => {
    await visualizeInferenceResultPage.testImage(imageFile, checkTable);
    await visualizeInferenceResultPage.checkForThresholdArea();
    await visualizeInferenceResultPage.setThreshold(threshold);
  };

  beforeAll(async () => {
    await Helpers.setDevCloudCookies(browser.params.devCloudCookies);

    await homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();

    await homePage.openConfigurationWizard();

    if (browser.params.isDevCloud) {
      jasmine.DEFAULT_TIMEOUT_INTERVAL *= 2.5;
      targetRow = await targetMachines.getCellByPlatformTag(DevCloudTargets.CORE);
    }

    imageNetNotAnnotated.name = helpers.generateName();
    await testUtils.uploadDataset(imageNetNotAnnotated);
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await homePage.openConfigurationWizard();
    await modelManagerPage.goToModelManager();
    await browser.sleep(2000);
  });

  // 73802
  xit('Should visualization form for Classification model', async () => {
    const model = classificationModels.squeezenetINT8;
    await runInferenceOnModelAndGoToVisualizationTab(model);

    await visualizeInferenceResultPage.fillVisualizationConfigurationField(
      modelManagerPage.usageContainer,
      model.accuracyData.adapter.taskType,
      'Task type'
    );
    const imageFile = testImages.streetImage;
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

  it('should check visualization form for an OD model', async () => {
    const model = ODModels.ssdliteMobileNetV2;
    const imageFile = testImages.instanceSegmImage;
    const expectedImageFile = testImages.mobilenetSSDExpected;
    await runInferenceOnModelAndGoToVisualizationTab(model);

    await visualizeInferenceResultPage.fillVisualizationConfigurationField(
      modelManagerPage.usageContainer,
      model.accuracyData.adapter.taskType,
      'Task type'
    );
    await visualizeInferenceResultPage.fillVisualizationConfigurationField(
      modelManagerPage.modelSubType,
      model.accuracyData.adapter.subType,
      'Model type'
    );

    await testImageAndSetThreshold(imageFile, '0.8');
    await visualizeInferenceResultPage.comparePredictionsAndBadgesWithExpectations(
      model,
      expectedImageFile,
      ['1', '61', '1', '67', '1'],
      5,
      { threshold: 0.2 }
    );
  });

  // 76138
  xit('Should visualization form for Instance Segmentation model', async () => {
    const model = ODModels.instanceSegmentationSecurity0050;
    const imageFile = testImages.semanticSegmImage;
    const expectedImageFile = testImages.instanceSegmentationSecurity0050Expected;
    await runInferenceOnModelAndGoToVisualizationTab(model);
    await visualizeInferenceResultPage.fillVisualizationConfigurationField(
      modelManagerPage.usageContainer,
      model.accuracyData.adapter.taskType,
      'Task type'
    );

    const configGroupPresent = await TestUtils.getElementByDataTestId('adapter-configuration').isPresent();
    expect(configGroupPresent).toBeTruthy('Adapter configuration should be displayed');

    const selectBoxIds = ['image_info_input', 'raw_masks_out', 'boxes_out', 'classes_out', 'scores_out'];
    const selectBoxLabelsById = {
      image_info_input: 'Input Info Layer',
      raw_masks_out: 'Masks',
      boxes_out: 'Boxes',
      classes_out: 'Classes',
      scores_out: 'Scores',
    };
    for (const selectBoxId of selectBoxIds) {
      const selectBox = element(by.id(selectBoxId));
      await visualizeInferenceResultPage.fillVisualizationConfigurationField(
        selectBox,
        model.accuracyData[selectBoxId],
        selectBoxLabelsById[selectBoxId]
      );
    }
    await testImageAndSetThreshold(imageFile, '0.8', false);
    await visualizeInferenceResultPage.comparePredictionsAndBadgesWithExpectations(
      model,
      expectedImageFile,
      ['1', '6'],
      5
    );
  });

  it('Should visualization form for Semantic Segmentation model', async () => {
    const model = ODModels.roadSegmentationAdas;
    const imageFile = testImages.streetImage;
    const expectedImageFile = testImages.roadSegmentationAdasExpected;
    await runInferenceOnModelAndGoToVisualizationTab(model);
    await visualizeInferenceResultPage.fillVisualizationConfigurationField(
      modelManagerPage.usageContainer,
      model.accuracyData.adapter.taskType,
      'Task type'
    );
    await visualizeInferenceResultPage.testImage(imageFile, false);
    await visualizeInferenceResultPage.comparePredictionsAndBadgesWithExpectations(
      model,
      expectedImageFile,
      ['0', '1', '2', '3'],
      4,
      { threshold: 0.5 }
    );
  });
  // TODO: Waiting for 52416
  xit('Should visualization form for Inpainting model', async () => {
    const model = ganModels.regionWiseInpainting;
    const imageFile = testImages.semanticSegmImage;
    const expectedImageFile = testImages.regionWiseInpaintingExpected;
    await runInferenceOnModelAndGoToVisualizationTab(model);

    await visualizeInferenceResultPage.fillVisualizationConfigurationField(
      modelManagerPage.usageContainer,
      model.accuracyData.adapter.taskType,
      'Task type'
    );
    const configGroupPresent = await TestUtils.getElementByDataTestId('preprocessing-config').isPresent();
    expect(configGroupPresent).toBeTruthy('PreProcessing config should be displayed');
    const expectedValue =
      model.accuracyData.inverseMask !== undefined ? (model.accuracyData.inverseMask ? 'Yes' : 'No') : undefined;
    await visualizeInferenceResultPage.checkAndSelectInverseMaskRadioButtons(expectedValue);
    await visualizeInferenceResultPage.selectVisualizeOutputTabAndCheckConfigContainer();
    await visualizeInferenceResultPage.uploadTestImage(imageFile);

    const paintingCanvas: ElementFinder = await TestUtils.getElementByDataTestId('painting-canvas');
    const imageCanvas: ElementFinder = await TestUtils.getElementByDataTestId('image-canvas');
    await browser.wait(until.presenceOf(paintingCanvas), browser.params.defaultTimeout);
    await browser.wait(until.presenceOf(imageCanvas), browser.params.defaultTimeout);
    await browser.sleep(4000);
    await browser
      .actions()
      .mouseMove(paintingCanvas, { x: 108, y: 145 })
      .mouseDown()
      .mouseMove(paintingCanvas, { x: 202, y: 415 })
      .mouseUp()
      .perform();
    // timeout for correct upload image
    await browser.sleep(4000);
    await testUtils.clickElement(visualizeInferenceResultPage.testImageBtn);

    const isImagesDifferent = await visualizeInferenceResultPage.isCanvasDifferentFromReference(
      expectedImageFile,
      model
    );
    expect(isImagesDifferent).toBeFalsy('Images should be equal');
  });

  // 78629
  xit('Should visualization form for Style Transfer model', async () => {
    const model = ganModels.itlabMosaic;
    const imageFile = testImages.semanticSegmImage;
    const expectedImageFile = testImages.itlabMosaicExpected;
    await runInferenceOnModelAndGoToVisualizationTab(model);

    await visualizeInferenceResultPage.fillVisualizationConfigurationField(
      modelManagerPage.usageContainer,
      model.accuracyData.adapter.taskType,
      'Task type'
    );
    await visualizeInferenceResultPage.testImage(imageFile, false);
    const isImagesDifferent = await visualizeInferenceResultPage.isCanvasDifferentFromReference(
      expectedImageFile,
      model
    );
    expect(isImagesDifferent).toBeFalsy('Images should be equal');
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await testUtils.deleteUploadedModels();
    await testUtils.uploadedModels.pop();
    await TestUtils.getBrowserLogs();
  });

  afterAll(async () => {
    await browser.sleep(5000);
    await testUtils.deleteUploadedDatasets();
    await TestUtils.getBrowserLogs();
  });
});
