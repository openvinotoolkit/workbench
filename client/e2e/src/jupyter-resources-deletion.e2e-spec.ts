import { browser } from 'protractor';

import { TestUtils } from './pages/test-utils';
import { LoginPage } from './pages/login.po';

describe('Preparation of resources for the Jupyter test', () => {
  let testUtils: TestUtils;

  beforeAll(async () => {
    testUtils = new TestUtils();
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await testUtils.analyticsPopup.refuseAnalyticsUsage();
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
  });

  it('should delete resources that were used for the Jupyter test: model and dataset', async () => {
    // Delete models
    await testUtils.configurationWizard.deleteUploadedModel('squeezenet1.1');
    await testUtils.configurationWizard.deleteUploadedModel(
      browser.params.precommit_scope.resources.ODModels.ssdliteMobileNetV2.name
    );

    // Delete datasets
    await testUtils.configurationWizard.deleteUploadedFile(
      browser.params.precommit_scope.resources.imageNetDataset.name
    );
    await testUtils.configurationWizard.deleteUploadedFile(browser.params.precommit_scope.resources.VOCDataset.name);
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });
});
