import { browser } from 'protractor';

import { ModelPrecisionEnum } from '@store/model-store/model.model';
import { OptimizationAlgorithm } from '@store/project-store/project.model';

import { InferenceType } from './pages/configuration-wizard.po';
import { Frameworks, TestUtils } from './pages/test-utils';
import { CalibrationUtils } from './pages/calibration-utils';
import { LoginPage } from './pages/login.po';
import {
  VisualizeInferenceResultPage,
  VisualizationOptionsNamesMap,
  VisualizationType,
} from './pages/inference-test-image.po';

import { Helpers } from './pages/helpers';
import { TargetMachines, DevCloudTargets } from './pages/target-machines.po';

describe('UI tests on parent predictions visualization', () => {
  const testUtils = new TestUtils();
  const calibrationUtils = new CalibrationUtils(testUtils);
  const visualizeInferenceResultPage = new VisualizeInferenceResultPage();
  const inferenceTarget = InferenceType.CPU;
  const datasetFileVOC = browser.params.precommit_scope.resources.VOCDataset;
  const dataSetFileSemantic = browser.params.precommit_scope.resources.smallSemanticSegmentationDataset;
  const datasetFileImageNet = browser.params.precommit_scope.resources.smallImageNetDataset;

  let targetRow;
  const targetMachines: TargetMachines = new TargetMachines();

  beforeAll(async () => {
    await Helpers.setDevCloudCookies(browser.params.devCloudCookies);

    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await testUtils.analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();

    if (browser.params.isDevCloud) {
      jasmine.DEFAULT_TIMEOUT_INTERVAL *= 2.5;
      targetRow = await targetMachines.getCellByPlatformTag(DevCloudTargets.CORE);
    }

    datasetFileVOC.name = testUtils.helpers.generateName();
    datasetFileImageNet.name = testUtils.helpers.generateName();
    dataSetFileSemantic.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(datasetFileVOC);
    await testUtils.uploadDataset(datasetFileImageNet);
    // TODO: 83248
    // await testUtils.uploadDataset(dataSetFileSemantic);
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  // 97828
  xit(
    'should create a project with a classification model, ' +
      'calibrate it, compare predictions on the output visualization tab',
    async () => {
      const modelFile = { name: 'googlenet-v4-tf', framework: Frameworks.TENSORFLOW };
      const imageFile: { pathToImage: string } =
        browser.params.precommit_scope.resources.testImages.classificationImage;

      await calibrationUtils.runInt8PipelineThroughDownloader(
        modelFile,
        datasetFileImageNet,
        inferenceTarget,
        'FP16',
        OptimizationAlgorithm.DEFAULT,
        null,
        null,
        null,
        null,
        targetRow
      );

      await visualizeInferenceResultPage.selectTestRibbon();
      await visualizeInferenceResultPage.visualizeByType(
        imageFile,
        VisualizationOptionsNamesMap[VisualizationType.PARENT_MODEL_PREDICTIONS]
      );

      // Search for top 2
      const expectedClasses = ['232', '231'];
      const result = await visualizeInferenceResultPage.arePredictionsEqualToExpectations(
        'prediction-class',
        expectedClasses,
        2
      );

      expect(result).toBeTruthy();

      const classes: string[] = await visualizeInferenceResultPage.getPredictionValues(
        visualizeInferenceResultPage.predictionsTable
      );

      const predictionScoresOptimized: string[] = await visualizeInferenceResultPage.getPredictionValues(
        visualizeInferenceResultPage.predictionsTable,
        'prediction-score'
      );
      const predictionScoresReference: string[] = await visualizeInferenceResultPage.getPredictionValues(
        visualizeInferenceResultPage.predictionsTable,
        'prediction-score-reference'
      );

      // Number of classes is X and as there are two predictions for each class
      expect(predictionScoresOptimized.length).toEqual(predictionScoresReference.length);
      expect(predictionScoresOptimized.length).toEqual(classes.length);
    }
  );

  it('should create a project with an OD model, calibrate it, compare predictions on the output visualization tab', async () => {
    const modelFile = { name: 'face-detection-retail-0044' };
    const imageFile: { pathToImage: string } = browser.params.precommit_scope.resources.testImages.personImage;
    await calibrationUtils.runInt8PipelineThroughDownloader(
      modelFile,
      datasetFileVOC,
      inferenceTarget,
      'FP16',
      OptimizationAlgorithm.DEFAULT,
      null,
      null,
      null,
      null,
      targetRow
    );

    await visualizeInferenceResultPage.selectTestRibbon();
    await visualizeInferenceResultPage.visualizeByType(
      imageFile,
      VisualizationOptionsNamesMap[VisualizationType.PARENT_MODEL_PREDICTIONS]
    );

    const expectedClass = '1';
    const predictedClassesOptimizedModel: string[] = await visualizeInferenceResultPage.getPredictionValues(
      visualizeInferenceResultPage.optimizedModelPredictionsContainer,
      'prediction-label'
    );

    const predictedClassesParentModel: string[] = await visualizeInferenceResultPage.getPredictionValues(
      visualizeInferenceResultPage.parentModelPredictionsContainer,
      'prediction-label'
    );

    expect(predictedClassesOptimizedModel.length === 1 && predictedClassesParentModel.length === 1).toBeTruthy();
    expect(
      predictedClassesParentModel[0] === expectedClass && predictedClassesOptimizedModel[0] === expectedClass
    ).toBeTruthy();
  });

  // TODO: 70558
  xit(
    'should download an instance segmentation model (deeplabv3), ' +
      'int8 calibration, check that predictions comparison is not available and that tensor comparison is available',
    async () => {
      const model = {
        name: 'deeplabv3',
        framework: Frameworks.TENSORFLOW,
      };
      const imageFile: { pathToImage: string } = browser.params.precommit_scope.resources.testImages.streetImage;
      await calibrationUtils.runInt8PipelineThroughDownloader(
        model,
        dataSetFileSemantic,
        InferenceType.CPU,
        ModelPrecisionEnum.FP16,
        OptimizationAlgorithm.DEFAULT,
        10,
        null,
        null,
        null,
        targetRow
      );

      await visualizeInferenceResultPage.selectTestRibbon();
      await visualizeInferenceResultPage.visualizeByType(
        imageFile,
        VisualizationOptionsNamesMap[VisualizationType.PARENT_MODEL_PREDICTIONS]
      );

      const expectedClasses = ['0', '7'];

      const predictionLabelsOptimized: string[] = await visualizeInferenceResultPage.getPredictionValues(
        visualizeInferenceResultPage.optimizedModelPredictionsContainer,
        'prediction-label'
      );

      const predictionLabelsParent: string[] = await visualizeInferenceResultPage.getPredictionValues(
        visualizeInferenceResultPage.parentModelPredictionsContainer,
        'prediction-label'
      );

      expect(
        predictionLabelsOptimized.every((predictionLabel) => expectedClasses.includes(predictionLabel))
      ).toBeTruthy();
      expect(predictionLabelsParent.every((predictionLabel) => expectedClasses.includes(predictionLabel))).toBeTruthy();
      expect(
        predictionLabelsOptimized.length === expectedClasses.length &&
          predictionLabelsParent.length === expectedClasses.length
      ).toBeTruthy();
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
