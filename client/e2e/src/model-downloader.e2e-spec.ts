import { browser, protractor } from 'protractor';

import { ModelPrecisionEnum } from '@store/model-store/model.model';

import { AppPage } from './pages/home-page.po';
import { Helpers } from './pages/helpers';
import { TestUtils } from './pages/test-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';
import { filterGroupNames } from './pages/model-download.po';

describe('UI tests on Downloading Models', () => {
  let homePage: AppPage;
  let analyticsPopup: AnalyticsPopup;
  let protractorUntil;
  let helpers: Helpers;
  let testUtils: TestUtils;

  beforeAll(async () => {
    homePage = new AppPage();
    helpers = new Helpers();
    analyticsPopup = new AnalyticsPopup();
    protractorUntil = protractor.ExpectedConditions;
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
    await testUtils.modelDownloadPage.openOMZTab();
    await browser.sleep(1500);
    expect(await testUtils.modelDownloadPage.countModelCards()).toBeGreaterThan(5);
  });

  it('select model from table, download it and delete (OMZv2)', async () => {
    const model = { name: 'squeezenet1.1', precision: ModelPrecisionEnum.FP16 };
    const uploadedElementsCount = await testUtils.configurationWizard.uploadsModelsTableElementsCount();
    await testUtils.modelManagerPage.goToModelManager();
    await testUtils.modelDownloadPage.selectAndDownloadModel(model.name);
    await testUtils.modelDownloadPage.convertDownloadedModelToIR(model.precision);
    await browser.wait(
      () => testUtils.configurationWizard.isUploadReady(model.name),
      browser.params.defaultTimeout * 9
    );
    await testUtils.configurationWizard.deleteUploadedModel(model.name);
    expect(await testUtils.configurationWizard.uploadsModelsTableElementsCount()).toEqual(uploadedElementsCount);
  });

  it('Downloading IR model', async () => {
    const model = { name: 'person-detection-retail-0013', framework: 'openvino' };
    const uploadedElementsCount = await testUtils.configurationWizard.uploadsModelsTableElementsCount();
    await testUtils.modelManagerPage.goToModelManager();
    await testUtils.modelDownloadPage.selectAndDownloadModel('person-detection-retail-0013');
    await browser.wait(
      () => testUtils.configurationWizard.isUploadReady(model.name),
      browser.params.defaultTimeout * 9
    );
    await testUtils.configurationWizard.deleteUploadedModel(model.name);
    expect(await testUtils.configurationWizard.uploadsModelsTableElementsCount()).toEqual(uploadedElementsCount);
  });

  it('filter model cards, find model, download it and delete', async () => {
    const expectedModelName = 'mobilefacedet-v1-mxnet';
    const uploadedElementsCount = await testUtils.configurationWizard.uploadsModelsTableElementsCount();
    await testUtils.modelManagerPage.goToModelManager();
    await testUtils.modelDownloadPage.openOMZTab();

    // Apply several filters
    await testUtils.modelDownloadPage.selectFilter('object_detection');
    await testUtils.modelDownloadPage.selectFilter('FP16');
    await testUtils.modelDownloadPage.selectFilter('MXNet');
    // Currently, only one model satisfies these filters
    expect(await testUtils.modelDownloadPage.getModelNameFromCard()).toEqual(expectedModelName);
    expect(await testUtils.modelDownloadPage.countModelCards()).toEqual(1);

    await testUtils.modelDownloadPage.selectAndDownloadModel(expectedModelName);
    await testUtils.modelDownloadPage.convertDownloadedModelToIR();
    await browser.wait(
      () => testUtils.configurationWizard.isUploadReady(expectedModelName),
      browser.params.defaultTimeout * 9
    );
    await testUtils.configurationWizard.deleteUploadedModel(expectedModelName);
    expect(await testUtils.configurationWizard.uploadsModelsTableElementsCount()).toEqual(uploadedElementsCount);
  });

  it('select and deselect several filters, check that they are applied correctly', async () => {
    await testUtils.modelManagerPage.goToModelManager();
    await testUtils.modelDownloadPage.openOMZTab();

    // Check that there are several filters available for groups
    for (const filterGroup of filterGroupNames) {
      expect(await testUtils.modelDownloadPage.countFiltersByGroup(filterGroup)).toBeTruthy();
    }

    await testUtils.modelDownloadPage.selectFilter('semantic_segmentation');
    await testUtils.modelDownloadPage.selectFilter('Caffe');
    // There should be no model cards based on the above filters
    expect(await testUtils.modelDownloadPage.countModelCards()).toEqual(0);
    await testUtils.modelDownloadPage.removeFilter('Caffe');
    expect(await testUtils.modelDownloadPage.countModelCards()).toBeTruthy();
    await testUtils.modelDownloadPage.removeFilter('semantic_segmentation');

    await testUtils.HFModelDownloadPage.selectFilter('Caffe');
    await testUtils.HFModelDownloadPage.selectFilter('INT8');
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
