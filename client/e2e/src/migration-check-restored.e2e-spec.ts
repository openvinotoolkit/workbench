import { browser } from 'protractor';

import { TestUtils } from './pages/test-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';

describe('UI testing of the restored state', () => {
  const testUtils: TestUtils = new TestUtils();
  const analyticsPopup: AnalyticsPopup = new AnalyticsPopup();
  const resources = browser.params.precommit_scope.resources;
  const datasetFileVOC = resources.VOCDataset;
  const datasetFileImageNet = resources.smallImageNetDataset;
  const modelNameMobileNet = 'Mobilenet';
  const modelNameClassification: string =
    browser.params.precommit_scope.resources.classificationModels.squeezenetV1.name;
  const modelNameOMZ = 'squeezenet1.1';

  beforeAll(async () => {
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    testUtils.uploadedModels.push(modelNameMobileNet);
    testUtils.uploadedModels.push(modelNameClassification);
    testUtils.uploadedModels.push(modelNameOMZ);
    testUtils.uploadedDatasets.push(datasetFileVOC.name);
    testUtils.uploadedDatasets.push(datasetFileImageNet.name);
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
  });

  // TODO 77019
  xit('Check project restoration with OD model from release', async () => {
    await testUtils.homePage.navigateTo();
    await testUtils.homePage.openProjectByModelAndDatasetNames(modelNameMobileNet, datasetFileVOC.name);
    await testUtils.checkExecutionAttributes();
  });

  // TODO 77019
  xit('Check project restoration with Classification model from release', async () => {
    await testUtils.homePage.navigateTo();
    await testUtils.homePage.openProjectByModelAndDatasetNames(modelNameClassification, datasetFileImageNet.name);
    await testUtils.checkExecutionAttributes();
  });

  // TODO 77019
  xit('Check project restoration with OMZ model from release', async () => {
    await testUtils.homePage.navigateTo();
    await testUtils.homePage.openProjectByModelAndDatasetNames(modelNameOMZ, datasetFileImageNet.name);
    await testUtils.checkExecutionAttributes();
  });

  it('Check models and datasets in tables after migration', async () => {
    await testUtils.homePage.openConfigurationWizard();

    await browser.sleep(1000);

    expect(await testUtils.configurationWizard.isModelRowPresent(modelNameMobileNet, datasetFileVOC.name)).toBeTruthy(
      'ssdliteMobileNetV2 not found in table'
    );
    expect(
      await testUtils.configurationWizard.isModelRowPresent(modelNameClassification, datasetFileImageNet.name)
    ).toBeTruthy('Squeezenet_V1_Caffe not found in table');
    expect(await testUtils.configurationWizard.isModelRowPresent(modelNameOMZ, datasetFileImageNet.name)).toBeTruthy(
      'squeezenet1.1 not found in table'
    );

    expect(await testUtils.configurationWizard.isDatasetRowPresent(datasetFileVOC.name)).toBeTruthy(
      'VOC dataset not found in table'
    );
    expect(await testUtils.configurationWizard.isDatasetRowPresent(datasetFileImageNet.name)).toBeTruthy(
      'ImageNet dataset not found in table'
    );
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });

  afterAll(async () => {
    await testUtils.deleteUploadedModels();
    await testUtils.deleteUploadedDatasets();
    await TestUtils.getBrowserLogs();
  });
});
