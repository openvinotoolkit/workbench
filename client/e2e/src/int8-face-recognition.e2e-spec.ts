import { browser } from 'protractor';

import { OptimizationAlgorithm, OptimizationAlgorithmPreset } from '@store/project-store/project.model';

import { InferenceType } from './pages/configuration-wizard.po';
import { TestUtils } from './pages/test-utils';
import { CalibrationUtils } from './pages/calibration-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';

describe('UI tests on Running Int8 Calibration (Python)', () => {
  let testUtils: TestUtils;
  let calibrationUtils: CalibrationUtils;
  let analyticsPopup: AnalyticsPopup;
  const dataSetFileLFW = browser.params.precommit_scope.resources.LFWDataset;

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
    dataSetFileLFW.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(dataSetFileLFW);
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  fit(
    'Should upload original Caffe sphereface model, convert to IR V10, run inference, run Int-8 Tune with LFW dataset, ' +
      'Simplified Mode',
    async () => {
      const modelFile = browser.params.precommit_scope.resources.faceRecognition.sphereface;
      const inferenceTarget = InferenceType.CPU;
      await calibrationUtils.runInt8PipelineThroughUpload(modelFile, dataSetFileLFW, inferenceTarget);
    }
  );

  fit(
    'Should upload original MxNet ArcFace model, convert to IR V11, run inference, run Int-8 Tune with LFW dataset, ' +
      'Simplified Mode',
    async () => {
      const modelFile = browser.params.precommit_scope.resources.faceRecognition.arcface;
      const inferenceTarget = InferenceType.CPU;
      await calibrationUtils.runInt8PipelineThroughUpload(
        modelFile,
        dataSetFileLFW,
        inferenceTarget,
        OptimizationAlgorithm.DEFAULT,
        OptimizationAlgorithmPreset.PERFORMANCE,
        undefined,
        10
      );
    }
  );

  fit(
    'Should upload original MxNet MobileFace model, convert to IR V11, run inference, run Int-8 Tune with LFW dataset, ' +
      'Simplified Mode',
    async () => {
      const modelFile = browser.params.precommit_scope.resources.faceRecognition.MobileFace;
      const inferenceTarget = InferenceType.CPU;
      await calibrationUtils.runInt8PipelineThroughUpload(
        modelFile,
        dataSetFileLFW,
        inferenceTarget,
        OptimizationAlgorithm.DEFAULT,
        OptimizationAlgorithmPreset.PERFORMANCE,
        undefined,
        10
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
