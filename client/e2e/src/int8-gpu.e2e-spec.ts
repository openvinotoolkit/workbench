import { browser } from 'protractor';

import { OptimizationAlgorithm, OptimizationAlgorithmPreset } from '@store/project-store/project.model';

import { InferenceType } from './pages/configuration-wizard.po';
import { TestUtils } from './pages/test-utils';
import { CalibrationUtils } from './pages/calibration-utils';
import { AnalyticsPopup } from './pages/analytics-popup.po';

// 73803
xdescribe('UI tests on Running Int8 Calibration (Python)', () => {
  let testUtils: TestUtils;
  let calibrationUtils: CalibrationUtils;
  let analyticsPopup: AnalyticsPopup;
  const datasetFileImageNet = browser.params.precommit_scope.resources.smallImageNetDataset;

  beforeAll(async () => {
    testUtils = new TestUtils();
    calibrationUtils = new CalibrationUtils(testUtils);
    analyticsPopup = new AnalyticsPopup();
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    datasetFileImageNet.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(datasetFileImageNet);
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  it(
    'should download shufflenet-v2-x1.0 FP16, select ImageNet dataset, ' +
      'run inference on GPU, run Int-8 Tune, performance type',
    async () => {
      const modelFile = { name: 'shufflenet-v2-x1.0' };
      const inferenceTarget = InferenceType.GPU;
      await calibrationUtils.runInt8PipelineThroughDownloader(
        modelFile,
        datasetFileImageNet,
        inferenceTarget,
        'FP16',
        OptimizationAlgorithm.DEFAULT,
        100,
        OptimizationAlgorithmPreset.PERFORMANCE
      );
    }
  );

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
