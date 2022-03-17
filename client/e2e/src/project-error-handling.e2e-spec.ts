import { browser, protractor } from 'protractor';

import {
  OptimizationAlgorithm,
  OptimizationAlgorithmPreset,
  ProjectStatusNames,
} from '@store/project-store/project.model';
import { ModelTaskTypeNames } from '@store/model-store/model.model';

import { InferenceType, OptimizationType } from './pages/configuration-wizard.po';
import { TestUtils } from './pages/test-utils';
import { InferenceUtils } from './pages/inference-utils';
import { CalibrationUtils } from './pages/calibration-utils';

describe('UI tests on Project error handling', () => {
  const testUtils = new TestUtils();
  const inferenceUtils = new InferenceUtils(testUtils);
  const calibrationUtils = new CalibrationUtils();
  const until = protractor.ExpectedConditions;
  const datasetFileImageNet = browser.params.precommit_scope.resources.smallImageNetDataset;
  const model = browser.params.precommit_scope.resources.classificationModels.squeezenetV1;
  const inferenceTarget = InferenceType.CPU;
  const validAccuracyUrl = 'projects/edit-accuracy';
  const validOptimizationUrl = 'projects/edit-calibration';

  beforeAll(async () => {
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);

    await testUtils.homePage.openConfigurationWizard();
    await testUtils.uploadDataset(datasetFileImageNet);
    await testUtils.modelManagerPage.goToModelManager();

    await inferenceUtils.runInference(
      model,
      datasetFileImageNet,
      inferenceTarget,
      browser.params.precommit_scope.resource_dir
    );
  });

  beforeEach(async () => {
    await testUtils.homePage.openProjectByModelAndDatasetNames(model.name, datasetFileImageNet.name);

    await testUtils.advancedAccuracy.goToAccuracyConfiguration();
    await testUtils.advancedAccuracy.changeTaskTypeAccuracyConfiguration(ModelTaskTypeNames.STYLE_TRANSFER);
    await testUtils.advancedAccuracy.clickSaveAccuracy();
    await browser.sleep(1500);
    await testUtils.accuracyReport.elements.createAccuracyReportButton.click();
    await testUtils.waitProjectStatus(ProjectStatusNames.ERROR);
  });

  it('should check accuracy with invalid parameters, get error message, click Try Again', async () => {
    expect(await testUtils.configurationWizard.isNotificationAvailable()).toBeTruthy('Notification is not available');
    expect(await testUtils.configurationWizard.checkErrorMessageBox()).toBeTruthy('Error message is not valid');

    await testUtils.configurationWizard.closeAllNotifications();

    expect(await testUtils.configurationWizard.checkTryAgainFunctional(validAccuracyUrl)).toBeTruthy(
      'Try again is not working correctly'
    );

    const accuracyReportButton = testUtils.accuracyReport.elements.createAccuracyReportButton;

    await testUtils.advancedAccuracy.changeTaskTypeAccuracyConfiguration(ModelTaskTypeNames.CLASSIFICATION);
    await testUtils.advancedAccuracy.clickSaveAccuracy();
    await browser.sleep(500);
    await browser.wait(until.elementToBeClickable(accuracyReportButton), browser.params.defaultTimeout);
    await accuracyReportButton.click();

    await testUtils.waitProjectStatus(ProjectStatusNames.READY);

    expect(await testUtils.configurationWizard.errorMessageBox.isPresent()).toBeFalsy(
      'Error message should not be shown'
    );
  });

  it('should run INT8 tune with invalid parameters, get error message, click Try Again', async () => {
    const levels = [OptimizationType.INT_8];
    const algorithm = OptimizationAlgorithm.ACCURACY_AWARE;
    const preset = OptimizationAlgorithmPreset.MIXED;

    await calibrationUtils.runInt8Calibration(
      model,
      datasetFileImageNet.name,
      inferenceTarget,
      levels,
      algorithm,
      10,
      10,
      false,
      preset
    );

    await browser.sleep(1000);

    await testUtils.waitProjectStatus(ProjectStatusNames.ERROR);

    expect(await testUtils.configurationWizard.isNotificationAvailable()).toBeTruthy('Notification is not available');
    expect(await testUtils.configurationWizard.checkErrorMessageBox()).toBeTruthy('Error message is not valid');

    await testUtils.configurationWizard.closeAllNotifications();

    expect(await testUtils.configurationWizard.checkTryAgainFunctional(validOptimizationUrl)).toBeTruthy(
      'Try again is not working correctly'
    );

    const calibrateButton = await calibrationUtils.configurationForm.calibrateBtn;
    await calibrateButton.isPresent();
    await testUtils.clickElement(calibrateButton);

    await testUtils.waitProjectStatus(ProjectStatusNames.READY);
    expect(await testUtils.configurationWizard.errorMessageBox.isPresent()).toBeFalsy(
      'Error message should not be shown'
    );
  });

  afterAll(async () => {
    await testUtils.deleteUploadedModels();
    await testUtils.uploadedModels.pop();
    await testUtils.deleteUploadedDatasets();
    await TestUtils.getBrowserLogs();
  });
});
