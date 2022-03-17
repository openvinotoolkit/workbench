import { browser, by } from 'protractor';

import { ModelGraphType } from '@store/model-store/model.model';

import { InferenceUtils } from './pages/inference-utils';
import { TestUtils } from './pages/test-utils';
import { VisualizeInferenceResultPage } from './pages/inference-test-image.po';

describe('UI tests on project placement after calibration', () => {
  const testUtils = new TestUtils();
  const visualizeInferenceResultPage = new VisualizeInferenceResultPage();
  const { homePage, modelManagerPage, configurationWizard } = testUtils;
  const inferenceUtils = new InferenceUtils(testUtils);
  const { resources, resource_dir } = browser.params.precommit_scope;
  const modelFile = resources.classificationModels.squeezenetV1;

  const clickTab = async (testId: string): Promise<void> => {
    const tab = TestUtils.getElementByDataTestId(testId);
    await tab.click();
    // waiting animation
    await browser.sleep(1000);
  };

  beforeAll(async () => {
    await testUtils.testPreparation();
    await homePage.openConfigurationWizard();

    await modelManagerPage.goToModelManager();
    await modelManagerPage.selectUploadModelTab();
    await inferenceUtils.uploadModelByFramework(modelFile, resource_dir);
    testUtils.uploadedModels.push(modelFile.name);
    await configurationWizard.waitForModelsRows();
    await configurationWizard.openModel(modelFile.name);
  });

  it('Should check details tab', async () => {
    await clickTab('details-tab');
    await configurationWizard.validateTheoreticalAnalysis();
    await configurationWizard.validateConversionSettings(modelFile);
  });

  it('Should check visualize tab', async () => {
    await clickTab('visualize-output');
    await visualizeInferenceResultPage.checkConfigContainer();
    await visualizeInferenceResultPage.fillVisualizationConfigurationField(
      modelManagerPage.usageContainer,
      modelFile.accuracyData.adapter.taskType,
      'Task type'
    );
    const imageFile = resources.testImages.streetImage;
    await visualizeInferenceResultPage.testImage(imageFile);
    const tableRows = await visualizeInferenceResultPage.predictionTableItems;

    expect(tableRows.length).toEqual(5, 'Count of prediction should be equal 5');

    const expectedClasses = ['468', '839', '829', '920', '536'];
    const result = await visualizeInferenceResultPage.arePredictionsEqualToExpectations(
      'prediction-class',
      expectedClasses
    );

    expect(result).toBeTruthy('Prediction classes should be equal');
  });

  it('Should check topology tab', async () => {
    await clickTab('visualize-topology-tab');
    const runtimeSvgElement = await testUtils.netronGraph.getNetronGraphSvgElement(ModelGraphType.ORIGINAL);
    await browser.wait(testUtils.until.presenceOf(runtimeSvgElement));
    expect(runtimeSvgElement.isPresent()).toBeTruthy();
  });

  it('Should check projects tab', async () => {
    await clickTab('projects-tab');
    const table = TestUtils.getElementByDataTestId('projects-by-model-table');
    expect(await table.isPresent()).toBeTruthy('Projects table should be present');
    const tableBody = table.all(by.tagName('tbody')).first();
    const rows = tableBody.all(by.tagName('tr')).count();
    expect(await rows).toEqual(0, 'Projects should not be exist');
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });

  afterAll(async () => {
    await testUtils.deleteUploadedDatasets();
    await testUtils.deleteUploadedModels();
    await testUtils.uploadedModels.pop();
    await TestUtils.getBrowserLogs();
  });
});
