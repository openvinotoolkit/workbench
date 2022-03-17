import { browser, ElementFinder } from 'protractor';

import { InferenceType } from './pages/configuration-wizard.po';
import { TestUtils } from './pages/test-utils';
import { Helpers } from './pages/helpers';
import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';
import { ModelManagerPage } from './pages/model-manager.po';

describe('UI testing of the restored state', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  let analyticsPopup: AnalyticsPopup;
  let modelManager: ModelManagerPage;
  let helpers: Helpers;
  const resources = browser.params.precommit_scope.resources;
  const datasetFileVOC = resources.VOCDataset;
  const datasetFileImageNet = resources.imageNetDataset;
  const modelNameMobileNet: string = resources.ODModels.ssdliteMobileNetV2.name;
  const modelNameResnet = 'squeezenet1.1';
  const modelNames: string[] = [modelNameResnet, modelNameMobileNet];

  beforeAll(async () => {
    testUtils = new TestUtils();
    inferenceUtils = new InferenceUtils(testUtils);
    analyticsPopup = new AnalyticsPopup();
    modelManager = new ModelManagerPage();
    helpers = new Helpers();
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();

    // Add to the lists so that it is possible to delete them in afterAll
    await testUtils.uploadedModels.push(modelNameMobileNet);
    await testUtils.uploadedModels.push(modelNameResnet);
    await testUtils.uploadedDatasets.push(datasetFileVOC.name);
    await testUtils.uploadedDatasets.push(datasetFileImageNet.name);
    await browser.sleep(5000); // Make sure that there was enough time to restore db
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
  });

  it('Check models and datasets restoration', async () => {
    await browser.sleep(1000);

    const numberOfModels: number = await modelManager.uploadsModelsTableElementsCount();
    const numberOfDatasets: number = await modelManager.uploadsDatasetsTableElementsCount();

    const modelNameEls = await TestUtils.getAllElementsByDataTestId('model-name');
    for (const modelNameEl of modelNameEls) {
      const modelName = await modelNameEl.getText();
      await console.log(`MODEL NAME: ${modelName}`);
    }

    // Check the exact numbers in tables
    expect(numberOfModels).toEqual(2, `There are ${numberOfModels} models in table.`);
    expect(numberOfDatasets).toEqual(2, `There are ${numberOfModels} datasets in table.`);

    // Check names
    let modelNameInTable: string = await TestUtils.getElementByDataTestId('model-name').getText();
    expect(modelNames.includes(modelNameInTable)).toBeTruthy();

    modelNameInTable = await TestUtils.getAllElementsByDataTestId('model-name').last().getText();
    expect(modelNames.includes(modelNameInTable)).toBeTruthy();

    // Check status
    let parentRow: ElementFinder = await TestUtils.getElementByDataTestId(`row_name_${modelNameMobileNet}`);
    let isModelReady: boolean = await TestUtils.getNestedElementByDataTestId(
      parentRow,
      'model-status-ready'
    ).isPresent();
    expect(isModelReady).toBeTruthy();

    parentRow = await TestUtils.getElementByDataTestId(`row_name_${modelNameResnet}`);
    isModelReady = await TestUtils.getNestedElementByDataTestId(parentRow, 'model-status-ready').isPresent();
    expect(isModelReady).toBeTruthy();
  });

  it('Check project restoration', async () => {
    await testUtils.homePage.navigateTo();
    await testUtils.homePage.openProjectByModelAndDatasetNames(modelNameMobileNet, datasetFileVOC.name);

    const accuracy = await testUtils.accuracyReport.waitAccuracyTaskAndGetAccuracyValue();
    expect(+accuracy).toBeTruthy();

    // Check execution info
    await testUtils.checkExecutionAttributes();
  });

  it('Check that inference can be ran on the restored project', async () => {
    // Running inference on the model+dataset
    await testUtils.configurationWizard.selectModelForInference(modelNameMobileNet);
    console.log(`Selected model: ${modelNameMobileNet}`);

    await testUtils.configurationWizard.selectDatasetRow(datasetFileVOC);

    await testUtils.configurationWizard.runInference(InferenceType.CPU);
    console.log('GO (inference) button clicked');
    const result = await testUtils.waitForProjectToBeReady();
    expect(result).toBeTruthy();
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });

  afterAll(async () => {
    await testUtils.deleteUploadedModels();
    await testUtils.deleteUploadedDatasets();
    await TestUtils.getBrowserLogs();
  });
});
