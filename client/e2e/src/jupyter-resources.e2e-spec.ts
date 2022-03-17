import { browser, by } from 'protractor';

import { OptimizationAlgorithm } from '@store/project-store/project.model';

import { TestUtils } from './pages/test-utils';
import { InferenceType, OptimizationType } from './pages/configuration-wizard.po';
import { CalibrationUtils } from './pages/calibration-utils';
import { InferenceUtils } from './pages/inference-utils';

describe('Preparation of resources for the Jupyter test', () => {
  const testUtils = new TestUtils();
  const calibrationUtils = new CalibrationUtils(testUtils);
  const inferenceUtils = new InferenceUtils(testUtils);

  const datasetFileImageNet = browser.params.precommit_scope.resources.imageNetDataset;
  const datasetFileVOC = browser.params.precommit_scope.resources.VOCDataset;

  beforeAll(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.uploadDataset(datasetFileImageNet);
    await testUtils.uploadDataset(datasetFileVOC);
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  it('should prepare resources for the Jupyter test: download model from OMZ, run inference, run INT8', async () => {
    const modelFile = { name: 'squeezenet1.1' };
    const inferenceTarget = InferenceType.CPU;
    await calibrationUtils.runInt8PipelineThroughDownloader(
      modelFile,
      datasetFileImageNet,
      inferenceTarget,
      'FP16',
      OptimizationAlgorithm.DEFAULT
    );
    // Calibrated project
    await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile, true);

    await testUtils.homePage.openModelProjectsFromStartPage(modelFile.name);
    const row = await TestUtils.getElementByDataTestId(`row_${modelFile.name}_${datasetFileImageNet.name}`);
    const openParentProjectButton = await TestUtils.getNestedElementByDataTestId(row, 'open-project');
    await openParentProjectButton.click();

    // Parent project
    await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile, true);
  });

  it('should upload OD model, run CPU inference, check accuracy and model analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.ssdliteMobileNetV2;
    const inferenceTarget = InferenceType.CPU;
    const levels = [OptimizationType.INT_8];

    await inferenceUtils.runInference(
      modelFile,
      datasetFileVOC,
      inferenceTarget,
      browser.params.precommit_scope.resource_dir
    );
    const accuracy = await testUtils.checkInferencePipeline(modelFile, datasetFileVOC.name, inferenceTarget, false);
    expect(+accuracy).toEqual(
      modelFile.accuracyData.accuracyValue,
      `Accuracy: ${accuracy} is not equal to expected: ${modelFile.accuracyData.accuracyValue}`
    );
    await calibrationUtils.runCalibration(
      modelFile,
      datasetFileVOC.name,
      inferenceTarget,
      levels,
      OptimizationAlgorithm.DEFAULT
    );
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });
});
