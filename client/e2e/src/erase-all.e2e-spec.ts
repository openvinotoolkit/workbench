import { browser, by, ElementFinder } from 'protractor';

import { InferenceType } from './pages/configuration-wizard.po';
import { LoginPage } from './pages/login.po';
import { Frameworks, TestUtils } from './pages/test-utils';
import { Helpers } from './pages/helpers';
import { InferenceUtils } from './pages/inference-utils';
import { AnalyticsPopup } from './pages/analytics-popup.po';

describe('UI tests on Erase All', () => {
  let analyticsPopup: AnalyticsPopup;
  let helpers: Helpers;

  const datasetFileVOC = browser.params.precommit_scope.resources.smallVOCDataset;
  const testUtils = new TestUtils();
  const inferenceUtils = new InferenceUtils(testUtils);

  beforeAll(async () => {
    analyticsPopup = new AnalyticsPopup();
    helpers = new Helpers();
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    datasetFileVOC.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(datasetFileVOC);
    await testUtils.modelManagerPage.goToModelManager();
  });

  it('Start downloading model from OMZ, click erase all', async () => {
    const model = { name: 'squeezenet1.0', framework: Frameworks.CAFFE };
    await testUtils.modelDownloadPage.selectAndDownloadModel(model.name);
    await testUtils.modelDownloadPage.convertDownloadedModelToIR();
    await testUtils.pressAndCheckEraseAllResults();
  });

  // 76569
  xit('Run inference, int8 tuning and press erase all button while progress is shown ', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.ssdliteMobileNetV2;
    modelFile.name = helpers.generateName();
    const inferenceTarget = InferenceType.CPU;

    await inferenceUtils.runInference(
      modelFile,
      datasetFileVOC,
      inferenceTarget,
      browser.params.precommit_scope.resource_dir,
      false
    );

    await testUtils.inferenceCard.selectInt8Tab();
    await testUtils.clickElement(testUtils.inferenceCard.calibrate);

    await browser.sleep(500);

    await testUtils.clickElement(testUtils.configurationForm.defaultAlgorithmOption);

    await testUtils.configurationWizard.setInferenceTime.click();

    await testUtils.clickElement(testUtils.configurationForm.calibrateBtn);

    await testUtils.inferenceCard.waitForProgressBar();

    await testUtils.pressAndCheckEraseAllResults();
  });

  it('Start measure accuracy, click erase all', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.ssdliteMobileNetV2;
    modelFile.name = helpers.generateName();
    const inferenceTarget = InferenceType.CPU;
    const inferenceTargetType = 'CPU';

    await inferenceUtils.runInference(
      modelFile,
      datasetFileVOC,
      inferenceTarget,
      browser.params.precommit_scope.resource_dir,
      false
    );

    await browser.sleep(500);
    await testUtils.clickElement(testUtils.inferenceCard.performTab);
    await browser.sleep(1000);

    // Select accuracy report ribbon
    await testUtils.clickElement(testUtils.accuracyReport.elements.createAccuracyRibbon);
    await browser.sleep(1000);

    // Fill accuracy
    await testUtils.clickElement(testUtils.accuracyReport.elements.provideAccuracyConfig);
    await testUtils.modelManagerPage.configureAccuracySettingsAndSave(
      modelFile.accuracyData.adapter.taskType,
      modelFile.accuracyData
    );

    // Start accuracy
    await testUtils.accuracyReport.elements.createAccuracyReportButton.click();

    const projectInfoContainer: ElementFinder = testUtils.inferenceCard.projectInfoContainer;
    const statusBar: ElementFinder = await projectInfoContainer.element(by.className('status-bar'));
    await browser.wait(testUtils.until.presenceOf(statusBar), browser.params.defaultTimeout * 2);

    browser.sleep(1000);
    await testUtils.pressAndCheckEraseAllResults();
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });

  afterAll(async () => {
    await TestUtils.getBrowserLogs();
  });
});
