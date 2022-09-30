import { browser, protractor } from 'protractor';

import { InferenceType } from './pages/configuration-wizard.po';
import { Frameworks, TestUtils } from './pages/test-utils';
import { Helpers } from './pages/helpers';
import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';
import { CalibrationUtils } from './pages/calibration-utils';
import { AnalyticsPopup } from './pages/analytics-popup.po';

describe('UI tests on Running inference', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  let analyticsPopup: AnalyticsPopup;
  let calibrationUtils: CalibrationUtils;
  const datasetFileVOC = browser.params.precommit_scope.resources.smallVOCDataset;
  const datasetFileImageNet = browser.params.precommit_scope.resources.smallImageNetDataset;
  let helpers: Helpers;
  let until;

  beforeAll(async () => {
    testUtils = new TestUtils();
    inferenceUtils = new InferenceUtils(testUtils);
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
    helpers = new Helpers();
    until = protractor.ExpectedConditions;
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  it('Select caffe model from table, download it, run inference, check accuracy', async () => {
    const model = { name: 'mobilenet-v2', framework: Frameworks.CAFFE };
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughDownloader(
      model,
      datasetFileImageNet,
      inferenceTarget,
      null,
      null,
      true
    );
  });

  xit('Select caffe model from table, download it, run inference and int8 tuning', async () => {
    const modelFile = { name: 'squeezenet1.1' };
    const inferenceTarget = InferenceType.CPU;
    await calibrationUtils.runInt8PipelineThroughDownloader(modelFile, datasetFileImageNet, inferenceTarget);
  });

  // TODO unskip when resolved 38040 - seems resolved
  // TODO However, possibly test can fail due to the same tensor name error as in 38040
  // TODO Actualize bug number
  xit(
    'should go to model manager and upload a YOLO V2 model, go to accuracy edit and select Tiny V2, check that change is applied ' +
      'in the models table',
    async () => {
      const modelsNumberBefore = 0;
      console.log('Models number before:', modelsNumberBefore);
      const modelFile = browser.params.precommit_scope.resources.ODModels.yoloV2;
      modelFile.name = helpers.generateName();
      const inferenceTarget = InferenceType.CPU;

      await inferenceUtils.runInferencePipelineThroughUpload(modelFile, datasetFileVOC, inferenceTarget);

      await testUtils.homePage.openConfigurationWizard();

      await testUtils.configurationWizard.checkModelType(modelFile.name);
      await browser.wait(until.presenceOf(testUtils.configurationWizard.fileType), browser.params.defaultTimeout);

      await expect(await testUtils.configurationWizard.fileType.getText()).toEqual('Yolo V2');

      await testUtils.homePage.navigateTo();
      await browser.wait(until.presenceOf(testUtils.homePage.availableModelsBlock), browser.params.defaultTimeout);
      await testUtils.homePage.openProjectByModelAndDatasetNames(modelFile.name, datasetFileVOC.name);

      let projectSelector = testUtils
        .topLevelProjectSelector(modelFile.name, datasetFileVOC.name, inferenceTarget)
        .bind(testUtils);
      await testUtils.advancedAccuracy.goToAccuracyConfiguration();
      await testUtils.configurationWizard.selectValueFromDropdown(
        testUtils.configurationWizard.modelSubType,
        'Tiny Yolo V2'
      );
      await testUtils.advancedAccuracy.elements.saveAccuracyBtn.click();
      await testUtils.inferenceCard.waitForRows();
      projectSelector = testUtils
        .topLevelProjectSelector(modelFile.name, datasetFileVOC.name, inferenceTarget)
        .bind(testUtils);
      await browser.wait(until.presenceOf(await projectSelector()), browser.params.defaultTimeout);
      console.log('Wait accuracy');
      const accuracyResult = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile);
      console.log(accuracyResult);

      await testUtils.homePage.openConfigurationWizard();

      await browser.wait(until.presenceOf(testUtils.configurationWizard.fileType), browser.params.defaultTimeout);
      await expect(await testUtils.configurationWizard.fileType.getText()).toEqual('Tiny Yolo V2');
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
