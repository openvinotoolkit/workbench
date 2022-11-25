import { browser } from 'protractor';

import { OptimizationAlgorithm, OptimizationAlgorithmPreset } from '@store/project-store/project.model';

import { IInferenceConfiguration } from '@shared/models/compound-inference-config';

import { InferenceType, OptimizationType } from './pages/configuration-wizard.po';
import { TestUtils } from './pages/test-utils';
import { CalibrationUtils } from './pages/calibration-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';

describe('UI tests on Running Int8 Calibration (Python)', () => {
  let testUtils: TestUtils;
  let calibrationUtils: CalibrationUtils;
  let analyticsPopup: AnalyticsPopup;
  const datasetFileVOC = browser.params.precommit_scope.resources.smallVOCDataset;
  const datasetFileImageNet = browser.params.precommit_scope.resources.smallImageNetDataset;

  beforeAll(async () => {
    testUtils = new TestUtils();
    calibrationUtils = new CalibrationUtils(testUtils);
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
    await testUtils.modelManagerPage.goToModelManager();
  });

  // 52012
  xit('Upload FP32 Mobilenet SSD Lite V2, VOC dataset, infer (CPU), int8, edit and re-check accuracy on int-8 model', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.ssdliteMobileNetV2;
    const inferenceTarget = InferenceType.CPU;
    await calibrationUtils.runInt8PipelineThroughUpload(modelFile, datasetFileVOC, inferenceTarget);

    const levels = [OptimizationType.INT_8];
    const int8ProjectSelector = testUtils
      .nestedProjectSelector(modelFile.name, datasetFileVOC.name, inferenceTarget, levels)
      .bind(testUtils);
    console.log('Run Int8 accuracy');
    const currentAccuracy = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile, false);
    expect(Number(currentAccuracy) >= 70).toBeTruthy();

    console.log('Edit Overlap');
    await testUtils.editOverlapThresholdAndSave(await int8ProjectSelector(), '0.52');

    console.log('Wait recheck');
    const accuracyResult = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile);

    console.log('Accuracy check finish:' + accuracyResult);
    expect(Number(accuracyResult) >= 0 && Number(accuracyResult) <= 100).toBeTruthy();
  });

  // 97829
  xit(
    'should download shufflenet-v2-x1.0 FP16, select ImageNet dataset, ' +
      'infer (CPU), run INT8, check two pieces of advice',
    async () => {
      const modelFile = { name: 'shufflenet-v2-x1.0' };
      const inferenceTarget = InferenceType.CPU;
      await calibrationUtils.runInt8PipelineThroughDownloader(
        modelFile,
        datasetFileImageNet,
        inferenceTarget,
        'FP16',
        OptimizationAlgorithm.DEFAULT,
        100,
        OptimizationAlgorithmPreset.PERFORMANCE
      );

      // Check advising logic for an original project
      const adviceCheckingParams = {
        adviceLevel: 0,
        isTheoryPresent: true,
        numberOfAdviceContainers: 2,
        adviceId: 'unquantizedConvolutions',
      };
      // Go back to the original project
      await testUtils.clickElement(testUtils.inferenceCard.linkToTheOriginalProject);
      await browser.sleep(500);
      await testUtils.clickElement(testUtils.inferenceCard.analyzeTab);
      await browser.sleep(1000);

      // Check the first advice
      await testUtils.inferenceCard.checkAdvice({ ...adviceCheckingParams, adviceId: 'calibrateFirst' });

      // Check the second advice
      await testUtils.inferenceCard.checkAdvice({
        ...adviceCheckingParams,
        adviceLevel: 1,
        adviceId: 'reordersOverload',
      });
    }
  );

  // 70558
  xit('Should upload a model, run inference, run Int-8 Tune, run group inference on Int-8', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.inceptionV3TF;
    const inferenceTarget = InferenceType.CPU;
    await calibrationUtils.runInt8PipelineThroughUpload(modelFile, datasetFileImageNet, inferenceTarget);

    const inferences: IInferenceConfiguration[] = [
      { batch: 2, nireq: 2 },
      { batch: 2, nireq: 3 },
      { batch: 2, nireq: 4 },
      { batch: 3, nireq: 2 },
      { batch: 3, nireq: 3 },
      { batch: 3, nireq: 4 },
      { batch: 4, nireq: 2 },
      { batch: 4, nireq: 3 },
      { batch: 4, nireq: 4 },
    ];

    await calibrationUtils.inferenceUtils.runGroupInferenceFromConfigurationBlock(false, inferences);
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
    await testUtils.deleteUploadedModels();
    await testUtils.uploadedModels.pop();
  });

  afterAll(async () => {
    await testUtils.deleteUploadedDatasets();
    await TestUtils.getBrowserLogs();
  });
});
