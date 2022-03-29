import { browser, ElementFinder } from 'protractor';

import { AppPage } from './pages/home-page.po';
import { TestUtils } from './pages/test-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';
import { HFModel } from './pages/model-file';
import { filterGroupNames } from './pages/hugging-face-model-download.po';

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

  it('filter model list, find model, download it and delete', async () => {
    const model: HFModel = browser.params.precommit_scope.resources.HFModels.russian_toxicity_classifier;
    const uploadedElementsCount = await testUtils.configurationWizard.uploadsModelsTableElementsCount();
    await testUtils.modelManagerPage.goToModelManager();
    await testUtils.HFModelDownloadPage.openHFTab();

    // Apply several filters and use a part of the model name to narrow the search
    await testUtils.HFModelDownloadPage.selectFilter(model.architecture);
    for (const language of model.languages) {
      await testUtils.HFModelDownloadPage.selectFilter(language);
    }
    await TestUtils.getElementByDataTestId('search-field').sendKeys('toxic');
    await browser.sleep(1000);

    expect(await testUtils.HFModelDownloadPage.getModelNameFromCard()).toEqual(model.name);
    await testUtils.HFModelDownloadPage.selectDownloadConvertModel(model);
    await testUtils.configurationWizard.deleteUploadedModel(model.name);
    expect(await testUtils.configurationWizard.uploadsModelsTableElementsCount()).toEqual(uploadedElementsCount);
  });

  it('select and deselect several filters, check that they are applied correctly', async () => {
    await testUtils.modelManagerPage.goToModelManager();
    await testUtils.HFModelDownloadPage.openHFTab();

    // Check that there are several filters available for groups
    for (const filterGroup of filterGroupNames) {
      expect(await testUtils.HFModelDownloadPage.countFiltersByGroup(filterGroup)).toBeTruthy();
    }

    await testUtils.HFModelDownloadPage.selectFilter('bert');
    await testUtils.HFModelDownloadPage.selectFilter('electra');
    // There should be no model cards based on the above filters
    expect(await testUtils.HFModelDownloadPage.countModelCards()).toEqual(0);
    await testUtils.HFModelDownloadPage.removeFilter('bert');
    expect(await testUtils.HFModelDownloadPage.countModelCards()).toBeTruthy();

    // 'electra' models are not currently supported so the model cards cannot be selected
    const firstModelCard: ElementFinder = await testUtils.HFModelDownloadPage.getFirstModelCard();
    expect(await testUtils.HFModelDownloadPage.isModelAvailableForDownload(firstModelCard)).toBeFalsy();

    // Expand language filter
    await testUtils.HFModelDownloadPage.expandFilterGroup('language');
    // Apply language filters, check that there are no models
    await testUtils.HFModelDownloadPage.selectFilter('zu');
    await testUtils.HFModelDownloadPage.selectFilter('ts');
    expect(await testUtils.HFModelDownloadPage.countModelCards()).toEqual(0);

    // Remove all filters, check that there are several model cards
    await testUtils.HFModelDownloadPage.resetFilters();
    expect(await testUtils.HFModelDownloadPage.countModelCards()).toBeTruthy();
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });
});
