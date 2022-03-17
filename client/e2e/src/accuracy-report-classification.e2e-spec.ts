import { browser } from 'protractor';

import { AccuracyReportType } from '@shared/models/accuracy-analysis/accuracy-report';

import { TestUtils } from './pages/test-utils';
import { CalibrationUtils } from './pages/calibration-utils';
import { InferenceType } from './pages/configuration-wizard.po';
import { ModelFile } from './pages/model-file';

describe('UI tests on Accuracy Reports with classification model: ', () => {
  const testUtils = new TestUtils();
  const calibrationUtils = new CalibrationUtils(testUtils);
  const datasetFileImageNet = browser.params.precommit_scope.resources.smallImageNetDataset;
  datasetFileImageNet.name = testUtils.helpers.generateName();

  const resourceModel: ModelFile = browser.params.precommit_scope.resources.classificationModels.inceptionV2;

  const models: Array<ModelFile> = [resourceModel];

  beforeAll(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.uploadDataset(datasetFileImageNet);

    for (const model of models) {
      await testUtils.homePage.openConfigurationWizard();
      await testUtils.modelManagerPage.goToModelManager();
      if (model.isOMZ) {
        await calibrationUtils.runInt8PipelineThroughDownloader(model, datasetFileImageNet, InferenceType.CPU);
      } else {
        await calibrationUtils.runInt8PipelineThroughUpload(model, datasetFileImageNet, InferenceType.CPU);
      }
    }
  });

  beforeEach(async () => {
    await browser.refresh();
    await testUtils.openInt8Project(resourceModel, datasetFileImageNet);
  });

  it(`Create accuracy report (basic accuracy config, annotated dataset) on model from resource`, async () => {
    await testUtils.accuracyReport.createAccuracyReport(
      AccuracyReportType.DATASET_ANNOTATIONS,
      resourceModel,
      resourceModel.isOMZ
    );

    const accuracyTable = await TestUtils.getElementByDataTestId('data-table');
    await browser.wait(testUtils.until.presenceOf(accuracyTable));
  });

  it(`Create Parent Model Predictions report (basic accuracy config, annotated dataset) on model from resource`, async () => {
    await testUtils.accuracyReport.createAccuracyReport(
      AccuracyReportType.PARENT_MODEL_PREDICTIONS,
      resourceModel,
      resourceModel.isOMZ
    );

    const accuracyTable = await TestUtils.getElementByDataTestId('data-table');
    await browser.wait(testUtils.until.presenceOf(accuracyTable));
  });

  it(`Create Tensor Distance report (basic accuracy config, annotated dataset) on model from resource`, async () => {
    await testUtils.accuracyReport.createAccuracyReport(
      AccuracyReportType.PARENT_MODEL_PER_TENSOR,
      resourceModel,
      resourceModel.isOMZ
    );

    const accuracyTable = await TestUtils.getElementByDataTestId('data-table');
    await browser.wait(testUtils.until.presenceOf(accuracyTable));
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });

  afterAll(async () => {
    await testUtils.deleteUploadedModels();
    await testUtils.uploadedModels.pop();
    await testUtils.deleteUploadedDatasets();
    await TestUtils.getBrowserLogs();
  });
});
