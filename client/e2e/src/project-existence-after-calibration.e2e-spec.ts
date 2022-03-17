import { browser } from 'protractor';

import {
  OptimizationAlgorithm,
  OptimizationAlgorithmPreset,
  ProjectStatusNames,
} from '@store/project-store/project.model';

import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';
import { TestUtils } from './pages/test-utils';
import { CalibrationUtils } from './pages/calibration-utils';
import { InferenceType, OptimizationType } from './pages/configuration-wizard.po';
import { MonacoEditorUtils } from './pages/monaco-editor-utils';

describe('UI tests on project existence after calibration', () => {
  const testUtils = new TestUtils();
  const editorUtils = new MonacoEditorUtils();
  const { homePage, analyticsPopup, modelManagerPage, configurationWizard, helpers } = testUtils;
  const calibrationUtils = new CalibrationUtils(testUtils);
  const inferenceUtils = new InferenceUtils(testUtils);
  const { resources, resource_dir } = browser.params.precommit_scope;
  const { cocoDataset } = resources;
  const modelFile = resources.classificationModels.squeezenetV1;
  const inferenceTarget = InferenceType.CPU;

  beforeAll(async () => {
    await homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await homePage.openConfigurationWizard();
    cocoDataset.name = helpers.generateName();
    await testUtils.uploadDataset(cocoDataset);

    await modelManagerPage.goToModelManager();
    await modelManagerPage.selectUploadModelTab();
    await inferenceUtils.uploadModelByFramework(modelFile, resource_dir);
    testUtils.uploadedModels.push(modelFile.name);
    await configurationWizard.waitForModelsRows();
    await configurationWizard.checkModelType(modelFile.name);
    await testUtils.selectSpecificModelAndRunInference(modelFile, cocoDataset, inferenceTarget);
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await homePage.navigateTo();
    await homePage.openProjectByModelAndDatasetNames(modelFile.name, cocoDataset.name);
  });

  it('Should run inference, fail accuracy check and int8 calibration', async () => {
    await browser.sleep(1000);

    const result: boolean = await testUtils.waitForProjectToBeReady();
    expect(result).toBeTruthy('Project should be ready');

    await testUtils.advancedAccuracy.goToAccuracyConfiguration();
    await testUtils.advancedAccuracy.goFromBasicToAdvanced();

    const config = {
      adapter: 'ssd',
      converter: 'imagenet',
      metrics: 'accuracy',
      preprocessing: 'auto_resize',
      postprocessing: '',
    };
    await editorUtils.updatePlaceholdersWithConfig(config);
    await testUtils.advancedAccuracy.clickSaveAccuracy();
    await browser.sleep(1000);
    await testUtils.clickElement(testUtils.accuracyReport.elements.createAccuracyReportButton);
    const accuracy: string = await testUtils.accuracyReport.waitAccuracyTaskAndGetAccuracyValue(true);
    expect(accuracy).toEqual('N/A', 'Accuracy should fail');

    await browser.sleep(5000);
    await calibrationUtils.runInt8Calibration(
      modelFile,
      cocoDataset.name,
      inferenceTarget,
      [OptimizationType.INT_8],
      OptimizationAlgorithm.ACCURACY_AWARE,
      10,
      10,
      false,
      OptimizationAlgorithmPreset.PERFORMANCE
    );
    await testUtils.waitProjectStatus(ProjectStatusNames.ERROR);
    await browser.refresh();
    await browser.sleep(1000);
    expect(await testUtils.inferenceCard.projectInfoContainer.isPresent()).toBeTruthy('Project should be present.');
    expect(await testUtils.inferenceCard.getProjectID()).toBeGreaterThan(0);
  });

  afterAll(async () => {
    await testUtils.deleteUploadedDatasets();
    await testUtils.deleteUploadedModels();
    await testUtils.uploadedModels.pop();
    await TestUtils.getBrowserLogs();
  });
});
