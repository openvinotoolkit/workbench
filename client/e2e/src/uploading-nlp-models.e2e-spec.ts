import { browser } from 'protractor';

import { AppPage } from './pages/home-page.po';
import { ModelManagerPage } from './pages/model-manager.po';
import { Helpers } from './pages/helpers';
import { TestUtils } from './pages/test-utils';

describe('UI tests on NLP models uploading and converting', () => {
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

  it('should go to model manager and upload NLP TF2 model, check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.nlpModels.smallBert;
    modelFile.name = helpers.generateName();
    await modelManager.uploadTensorFlowV2Model(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });

  it('should go to model manager and upload NLP ONNX model, check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.nlpModels.toxicBert;
    modelFile.name = helpers.generateName();
    await modelManager.uploadOnnxModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });
});
