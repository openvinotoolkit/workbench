import { browser } from 'protractor';

import { AppPage } from './pages/home-page.po';
import { TestUtils } from './pages/test-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';

describe('UI tests on Downloading HF Models', () => {
  let homePage: AppPage;
  let analyticsPopup: AnalyticsPopup;
  let testUtils: TestUtils;

  beforeAll(async () => {
    homePage = new AppPage();
    analyticsPopup = new AnalyticsPopup();
    testUtils = new TestUtils();
    await homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await homePage.openConfigurationWizard();
  });

  it('list of models available for downloading is fetched', async () => {
    await testUtils.modelManagerPage.goToModelManager();
    await testUtils.HFModelDownloadPage.openHFTab();
    await browser.sleep(1500);
    expect(await testUtils.HFModelDownloadPage.countModelCards()).toBeGreaterThan(5);
  });

  it('select model from table, download it and delete', async () => {
    const model = browser.params.precommit_scope.resources.HFModels.ms_marco_MiniLM_L_12_v2;
    const uploadedElementsCount = await testUtils.configurationWizard.uploadsModelsTableElementsCount();
    await testUtils.modelManagerPage.goToModelManager();
    await testUtils.HFModelDownloadPage.selectDownloadConvertModel(model);
    await testUtils.configurationWizard.deleteUploadedModel(model.name);
    expect(await testUtils.configurationWizard.uploadsModelsTableElementsCount()).toEqual(uploadedElementsCount);
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });
});
