import { browser } from 'protractor';

import { InferenceType } from './pages/configuration-wizard.po';
import { TestUtils } from './pages/test-utils';
import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';
import { ModelFile } from './pages/model-file';

// 77337
xdescribe('Check projects table is populated with appropriate data regarding model centric approach', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  let analyticsPopup: AnalyticsPopup;
  const datasetFileVOC = browser.params.precommit_scope.resources.smallVOCDataset;
  const datasetFileImageNet = browser.params.precommit_scope.resources.smallImageNetDataset;

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
    datasetFileVOC.name = testUtils.helpers.generateName();
    datasetFileImageNet.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(datasetFileVOC);
    await testUtils.uploadDataset(datasetFileImageNet);
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
  });

  async function checkPresenceOfLandingTable() {
    await testUtils.header.navigateHome();
    await browser.wait(async () => {
      return testUtils.homePage.availableModelsBlock.isPresent();
    }, browser.params.defaultTimeout);
    expect(await testUtils.homePage.availableModelsBlock.isPresent()).toBeTruthy();
  }

  async function createProject(): Promise<{ modelName: string; datasetName: string }> {
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
    const modelFile: ModelFile = browser.params.precommit_scope.resources.ODModels.yoloV2;
    modelFile.name = testUtils.helpers.generateName();
    await inferenceUtils.runInference(
      modelFile,
      datasetFileVOC,
      InferenceType.CPU,
      browser.params.precommit_scope.resource_dir
    );
    await browser.sleep(1500);
    expect(await testUtils.inferenceCard.projectInfoContainer.isPresent()).toBeTruthy();
    return { modelName: modelFile.name, datasetName: datasetFileVOC.name };
  }

  it('Open home page, check no active models', async () => {
    expect(testUtils.homePage.availableModelsBlock.isPresent()).toBeFalsy();
  });

  it('Upload OD model, use VOC dataset, run CPU inference, check landing model cards', async () => {
    const modelsCountBeforeTest = await testUtils.header.getModelCardsCount();
    const { modelName } = await createProject();
    await browser.sleep(1000);

    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await testUtils.homePage.openModelProjectsFromStartPage(modelName);

    const projectsCount: number = await testUtils.inferenceCard.getProjectsCount();
    expect(projectsCount).toEqual(1);
    await checkPresenceOfLandingTable();
    const activeProjects = await testUtils.header.getModelCardsCount();
    expect(activeProjects).toEqual(modelsCountBeforeTest + 1);
  });

  it(
    'Upload OD model, use VOC dataset, run CPU inference, check landing table ' +
      'projects table, open project from landing page',
    async () => {
      const modelsCountBeforeTest = await testUtils.header.getModelCardsCount();
      const { modelName, datasetName } = await createProject();

      await browser.sleep(1000);
      await testUtils.homePage.navigateTo();
      await browser.sleep(1000);
      await testUtils.homePage.openModelProjectsFromStartPage(modelName);

      expect(await testUtils.inferenceCard.getProjectsCount()).toEqual(1);

      await checkPresenceOfLandingTable();

      const activeProjects = await testUtils.header.getModelCardsCount();

      expect(activeProjects).toEqual(modelsCountBeforeTest + 1);

      await testUtils.homePage.openProjectByModelAndDatasetNames(modelName, datasetName);
      expect(testUtils.inferenceCard.checkUrl(await browser.getCurrentUrl())).toBeTruthy();
    }
  );

  it(
    'Upload OD model, use VOC dataset, run CPU inference, check landing table ' +
      ' delete model, check that project is removed',
    async () => {
      const modelsCountBeforeTest = await testUtils.header.getModelCardsCount();
      await testUtils.homePage.openConfigurationWizard();
      await testUtils.modelManagerPage.goToModelManager();
      const modelFile: ModelFile = browser.params.precommit_scope.resources.ODModels.yoloV2;
      modelFile.name = testUtils.helpers.generateName();
      await inferenceUtils.runInference(
        modelFile,
        datasetFileVOC,
        InferenceType.CPU,
        browser.params.precommit_scope.resource_dir
      );

      await checkPresenceOfLandingTable();

      let activeProjects = await testUtils.header.getModelCardsCount();
      expect(activeProjects).toEqual(modelsCountBeforeTest + 1);

      await testUtils.homePage.openConfigurationWizard();
      await testUtils.configurationWizard.deleteUploadedModel(modelFile.name).catch((err) => {
        console.log(err);
        expect(false).toBeTruthy();
      });
      testUtils.uploadedModels.pop();

      activeProjects = await testUtils.header.getModelCardsCount();
      expect(activeProjects).toEqual(modelsCountBeforeTest);
    }
  );

  it('should navigate home page after inference, check model name on landing page', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.yoloV2;
    modelFile.name = testUtils.helpers.generateName();
    await testUtils.modelManagerPage.goToModelManager();
    await inferenceUtils.runInference(
      modelFile,
      datasetFileVOC,
      InferenceType.CPU,
      browser.params.precommit_scope.resource_dir
    );

    await checkPresenceOfLandingTable();

    const name = await testUtils.homePage.modelName;
    const modelName = await testUtils.homePage.modelName;
    expect(modelName).toEqual(modelFile.name);
  });

  it('should navigate home page after inference, refresh it, check model name, dataset name in landing table', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.yoloV2;
    modelFile.name = testUtils.helpers.generateName();
    await testUtils.modelManagerPage.goToModelManager();
    await inferenceUtils.runInference(
      modelFile,
      datasetFileVOC,
      InferenceType.CPU,
      browser.params.precommit_scope.resource_dir
    );
    await testUtils.header.navigateHome();
    await browser.sleep(1000);
    await browser.refresh();

    await checkPresenceOfLandingTable();

    const modelName = await testUtils.homePage.modelName;
    expect(modelName).toEqual(modelFile.name);
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
