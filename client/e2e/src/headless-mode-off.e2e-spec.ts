import { browser } from 'protractor';

import { ModelManagerPage } from './pages/model-manager.po';
import { Helpers } from './pages/helpers';
import { TestUtils } from './pages/test-utils';
import { AppPage } from './pages/home-page.po';
import { InferenceType } from './pages/configuration-wizard.po';
import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';

describe('UI tests with disabled headless mode', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  let homePage: AppPage;
  let modelManager: ModelManagerPage;
  let helpers: Helpers;
  let modelsNumberBefore: number;
  let analyticsPopup: AnalyticsPopup;
  const datasetFileImageNet = browser.params.precommit_scope.resources.imageNetDataset;
  const defaultTimeoutInterval = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  beforeAll(async () => {
    testUtils = new TestUtils();
    homePage = new AppPage();
    modelManager = new ModelManagerPage();
    helpers = new Helpers();
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

  it('should upload TensorFlow V2 model, convert, check that model is in table', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.DenseNetTFV2;
    modelFile.name = helpers.generateName();
    await modelManager.uploadTensorFlowV2Model(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
  });

  it('should upload Classification TensorFlow V2 model, run CPU inference, check accuracy and model analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.ResNet50V2TFV2;
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, datasetFileImageNet, inferenceTarget);
  });

  it('should upload folder with images and create N-A dataset', async () => {
    const datasetName = helpers.generateName();

    await homePage.openConfigurationWizard();
    await testUtils.configurationWizard.openImportDatasetFilePage();
    await testUtils.configurationWizard.uploadFolderForNADataset(datasetName);
    await testUtils.configurationWizard.deleteUploadedFile(datasetName);
  });

  // FIXME: 92937
  xit(
    'should upload FasterRCNNInceptionResNetV2 model, specify usage of pipeline config,' +
      ' check that model is in table',
    async () => {
      try {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = defaultTimeoutInterval * 2;
        const modelFile = browser.params.precommit_scope.resources.ODModels.FasterRCNNInceptionResNetV2;
        modelFile.name = helpers.generateName();
        await modelManager.uploadTensorFlowV2Model(modelFile, browser.params.precommit_scope.resource_dir);
        await testUtils.checkModelAndCleanUp(modelFile, modelsNumberBefore);
      } catch (e) {
        console.log(e);
      } finally {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = defaultTimeoutInterval;
      }
    }
  );

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
