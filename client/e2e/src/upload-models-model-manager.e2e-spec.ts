import { browser, ElementFinder } from 'protractor';

import { AppPage } from './pages/home-page.po';
import { ModelManagerPage } from './pages/model-manager.po';
import { Helpers } from './pages/helpers';
import { Frameworks, TestUtils } from './pages/test-utils';
import { ModelFile } from './pages/model-file';

describe('UI tests on models uploading and converting', () => {
  let testUtils: TestUtils;
  let homePage: AppPage;
  let modelManager: ModelManagerPage;
  let helpers: Helpers;
  let modelsNumberBefore: number;

  beforeAll(async () => {
    testUtils = new TestUtils();
    homePage = new AppPage();
    modelManager = new ModelManagerPage();
    helpers = new Helpers();
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await homePage.openConfigurationWizard();
    modelsNumberBefore = await modelManager.uploadsModelsTableElementsCount();
    console.log('Models number before:', modelsNumberBefore);
    await browser.sleep(700);
    await modelManager.goToModelManager();
    await modelManager.selectUploadModelTab();
  });

  it('should go to model manager and upload Object Detection IR model, check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.ssdliteMobileNetV2;
    modelFile.name = helpers.generateName();
    await modelManager.uploadIRModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });

  it('should go to model manager and upload IR v7 model, check that model is in table and has deprecation warning', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.inceptionV3Deprecated;
    modelFile.name = helpers.generateName();
    const errorMessage = await modelManager.uploadDeprecatedIRModel(
      modelFile,
      browser.params.precommit_scope.resource_dir
    );
    await testUtils.checkModelDeprecated(modelFile, modelsNumberBefore, errorMessage);
  });

  it('should upload deprecated IR v10 model, check that model is in table and has deprecation warning', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.squeezenetIRV10;
    modelFile.name = helpers.generateName();
    const errorMessage = await modelManager.uploadDeprecatedIRModel(
      modelFile,
      browser.params.precommit_scope.resource_dir
    );
    await testUtils.checkModelDeprecated(modelFile, modelsNumberBefore, errorMessage);
  });

  it('should go to model manager and upload Caffe model, check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.mobilenet;
    modelFile.name = helpers.generateName();
    await modelManager.uploadCaffeModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });

  it('should go to model manager and upload MxNet model, check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.SSDInceptionV3;
    modelFile.name = helpers.generateName();
    await modelManager.uploadMxNetModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });
  it('should go to model manager and upload legacy MxNet model with reverse output channels, check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.Resnet152;
    modelFile.name = helpers.generateName();
    await modelManager.uploadMxNetModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });

  // 74139
  xit('should go to model manager and upload ONNX model, check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.mobilenetV2;
    modelFile.name = helpers.generateName();
    await modelManager.uploadOnnxModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });

  it('should go to model manager and upload ONNX model with input shapes, check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.resnet50V2;
    modelFile.name = helpers.generateName();
    await modelManager.uploadOnnxModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });

  // 74928
  xit('should upload TF model with meta graph and OD API, select custom config, convert and check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.SSDLiteMobilenetV2;
    modelFile.name = helpers.generateName();
    await modelManager.uploadTensorFlowModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });
  // TODO: 76002
  xit(
    'should upload Caffe model, convert with incorrect inputs, ' +
      'click edit, pass correct values, check that model is in table',
    async () => {
      const modelFile = browser.params.precommit_scope.resources.classificationModels.googlenetV2;
      modelFile.name = helpers.generateName();
      const { resource_dir } = browser.params.precommit_scope;
      const modelFileWithIncorrectInput: ModelFile = {
        ...modelFile,
        conversionSettings: { ...modelFile.conversionSettings, inputLayers: [{ name: 'data', shape: [1, 1, 1] }] },
        backendData: undefined,
      };
      await modelManager.importModel('Caffe', modelFileWithIncorrectInput, resource_dir);
      await modelManager.fillImportFormAndConvertModel(modelFileWithIncorrectInput, resource_dir);

      const errorBox = await TestUtils.getElementByDataTestId('message-box-error');
      console.log('Wait for error icon');
      await browser.wait(
        testUtils.until.presenceOf(errorBox),
        browser.params.defaultTimeout * 5,
        `Error icon is not present for ${modelFile.name} model`
      );

      expect(await testUtils.configurationWizard.isNotificationAvailable()).toBeTruthy('Notification is not available');

      await testUtils.configurationWizard.closeAllNotifications();

      await browser.sleep(500);
      await modelManager.checkTipExpand('originalChannelsOrder-tip');
      await modelManager.fillImportFormAndConvertModel(modelFile, resource_dir);
      const modelsTable = await testUtils.configurationWizard.modelsTable;
      await browser.wait(testUtils.until.presenceOf(modelsTable), browser.params.defaultTimeout * 2);
      await testUtils.modelManagerPage.isUploadReady();
      await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
    }
  );

  // 74928
  xit(
    'should upload frozen OD TF model with no input shapes, select custom config, fill output layers, ' +
      'convert and check that model is in table',
    async () => {
      const modelFile = browser.params.precommit_scope.resources.ODModels.rcnnInceptionV2Coco;
      modelFile.name = helpers.generateName();
      await modelManager.uploadTensorFlowModel(modelFile, browser.params.precommit_scope.resource_dir);
      await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
    }
  );

  it('should upload Caffe model, fill in means and scales, convert, check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.mtcnno;
    modelFile.name = helpers.generateName();
    await modelManager.uploadCaffeModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });

  it(
    'should go to model manager and upload MxNet model with reverse output channels, means, scales and output layer, ' +
      'convert, check that model is in table',
    async () => {
      const modelFile = browser.params.precommit_scope.resources.classificationModels.OctaveDenseNet121;
      modelFile.name = helpers.generateName();
      await modelManager.uploadMxNetModel(modelFile, browser.params.precommit_scope.resource_dir);
      await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
    }
  );

  it('should upload multi-input Caffe model, fill in input shapes for both layers, convert, check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.fasterRCNNResNet101;
    modelFile.name = helpers.generateName();
    await modelManager.uploadCaffeModel(modelFile, browser.params.precommit_scope.resource_dir, 2);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });

  // 76446
  xit('should upload brain tumor classification IR model, check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.brainTumor;
    modelFile.name = helpers.generateName();
    await modelManager.uploadIRModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });

  it('should upload YOLO-Tiny-V3-TF model, upload custom transformations config, check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.yoloV3Tiny;
    modelFile.name = helpers.generateName();
    await modelManager.uploadTensorFlowModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });

  // TODO: 76048
  xit('should upload denoise TF model, check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.ganModels.denoise;
    modelFile.name = helpers.generateName();
    await modelManager.uploadTensorFlowModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });

  // 74928
  xit('should upload facenet TF model, check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.faceRecognition.facenetTf;
    modelFile.name = helpers.generateName();
    await modelManager.uploadTensorFlowModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });

  // TODO: 74694
  xit('should go to model manager and upload ONNX model with dynamic shapes, check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.textRecognition.bertTiny5FinetunedSquadv2;
    modelFile.name = helpers.generateName();
    await modelManager.uploadOnnxModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });

  // TODO: 74694
  xit('should go to model manager and upload TF model with dynamic shapes, check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.bdtiYoloV4TinyTf;
    modelFile.name = helpers.generateName();
    await modelManager.uploadTensorFlowModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });

  // 78628
  xit('should check what setup environment stop after leave convert page', async () => {
    const modelFile = { name: 'deeplabv3', framework: Frameworks.TENSORFLOW };
    await testUtils.clickElement(testUtils.modelDownloadPage.elements.OMZTab);
    await testUtils.modelDownloadPage.selectAndDownloadModel(modelFile.name);

    await browser.wait(async () => {
      const tabElement: ElementFinder = await testUtils.modelManagerPage.modelUploadPanel;
      return tabElement.isPresent();
    }, browser.params.defaultTimeout);

    await browser.sleep(500);

    console.log('Click home page');
    const homeIcon = await testUtils.homePage.homePageButton;
    await homeIcon.click();

    console.log('Click confirm');
    const confirmBtn = TestUtils.getElementByDataTestId('confirm');
    if (confirmBtn.isPresent()) {
      await confirmBtn.click();
    }

    const mainImage = await testUtils.homePage.capabilitiesImage;
    await browser.wait(testUtils.until.presenceOf(mainImage), browser.params.defaultTimeout);

    await testUtils.downloadModelFromOmz(modelFile);
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });
});
