import { browser, protractor } from 'protractor';

import { Frameworks, TestUtils } from './pages/test-utils';
import { VisualizeInferenceResultPage } from './pages/inference-test-image.po';
import {
  VisualizationOptionsNamesMap,
  VisualizationType,
} from '../../src/app/modules/accuracy/components/visualization/network-output/original-image-controls/original-image-controls.component';
import { AnalyticsPopup } from './pages/analytics-popup.po';
import { Helpers } from './pages/helpers';

describe('E2E tests Explainable AI: ', () => {
  const testUtils: TestUtils = new TestUtils();
  const analyticsPopup = new AnalyticsPopup();
  const visualizeInferenceResultPage = new VisualizeInferenceResultPage();
  const model = { name: 'squeezenet1.1', framework: Frameworks.CAFFE };
  const until = protractor.ExpectedConditions;
  const { resources } = browser.params.precommit_scope;

  beforeAll(async () => {
    await Helpers.setDevCloudCookies(browser.params.devCloudCookies);

    await testUtils.homePage.navigateTo();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.downloadModelFromOmz(model);

    console.log('Open visualization page');
    await testUtils.configurationWizard.openModel(model.name);
    await browser.sleep(2000);
  });

  beforeEach(async () => {
    await testUtils.homePage.navigateTo();
    console.log('Open visualization page');
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.configurationWizard.openModel(model.name);
    await browser.sleep(2000);
    await testUtils.clickElement(TestUtils.getElementByDataTestId('visualize-output'));
    await browser.sleep(1500);
  });

  it('Uploads image, checks that the inputs are disabled', async () => {
    const imageFile = resources.testImages.streetImage;

    await browser.wait(until.presenceOf(visualizeInferenceResultPage.testImageFile), browser.params.defaultTimeout);
    console.log('Upload test image');
    await visualizeInferenceResultPage.uploadTestImage(imageFile);
    const visualizationTypesField = await visualizeInferenceResultPage.visualizationTypesField;
    await testUtils.selectValueFromDropdown(
      visualizationTypesField,
      VisualizationOptionsNamesMap[VisualizationType.EXPLAIN]
    );
    await visualizeInferenceResultPage.testImageBtn.click();
    await browser.sleep(1000);
    expect(await visualizeInferenceResultPage.selectImageBtn.isEnabled()).toBeFalsy(
      'Select image button is not disabled'
    );
    expect(await visualizeInferenceResultPage.testImageBtn.isEnabled()).toBeFalsy('Visualize button is not disabled');

    await browser.sleep(15000);

    await browser.wait(
      until.presenceOf(visualizeInferenceResultPage.explanationMaskNotSelectedContainer),
      browser.params.defaultTimeout
    );
  });

  it('Click visualize, checks progress, click cancel', async () => {
    const imageFile = resources.testImages.streetImage;
    await visualizeInferenceResultPage.visualizeByType(
      imageFile,
      VisualizationOptionsNamesMap[VisualizationType.EXPLAIN],
      true
    );
    console.log('Visualization clicked');

    await browser.wait(
      until.presenceOf(visualizeInferenceResultPage.visualizationProgress),
      browser.params.defaultTimeout
    );
    console.log('Progress is present');

    await browser.sleep(1000);
    const reg = new RegExp(`[0-9]+`);
    expect(reg.test(await visualizeInferenceResultPage.visualizationProgress.getText())).toBeTruthy(
      'Progress not displayed'
    );

    await browser.wait(
      until.elementToBeClickable(visualizeInferenceResultPage.visualizationCancelButton),
      browser.params.defaultTimeout
    );
    while (await visualizeInferenceResultPage.visualizationProgress.isPresent()) {
      await testUtils.clickElement(visualizeInferenceResultPage.visualizationCancelButton);
    }

    await browser.wait(
      until.invisibilityOf(visualizeInferenceResultPage.visualizationProgress),
      browser.params.defaultTimeout
    );

    await browser.sleep(2000);
  });

  it('selects all classes, checks for changes in the heatmap', async () => {
    const imageFile = resources.testImages.streetImage;
    await visualizeInferenceResultPage.visualizeByType(
      imageFile,
      VisualizationOptionsNamesMap[VisualizationType.EXPLAIN]
    );
    await browser.wait(
      until.presenceOf(visualizeInferenceResultPage.explanationMaskNotSelectedContainer),
      browser.params.defaultTimeout
    );

    const mask = await visualizeInferenceResultPage.explanationMask;
    await browser.wait(until.presenceOf(visualizeInferenceResultPage.predictionsTable), browser.params.defaultTimeout);
    await browser.sleep(1000);
    const rows = await visualizeInferenceResultPage.predictionTableItems;

    console.log(`Check heat maps ${rows.length}`);

    let maskSrc = '';
    for (const row of rows) {
      await row.click();
      await browser.sleep(1000);
      const newMaskSrc = await mask.getAttribute('src');
      expect(maskSrc !== newMaskSrc).toBeTruthy('Mask source is not updated');
      maskSrc = newMaskSrc;
    }
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
    await browser.sleep(5000);

    await browser.refresh();
  });

  afterAll(async () => {
    await testUtils.deleteUploadedModels();
    await testUtils.uploadedModels.pop();
    await testUtils.deleteUploadedDatasets();
    await TestUtils.getBrowserLogs();
  });
});
