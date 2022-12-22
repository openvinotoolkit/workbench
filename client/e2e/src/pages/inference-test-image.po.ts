import { PixelmatchOptions } from 'pixelmatch';

import { browser, by, element, ElementArrayFinder, ElementFinder, protractor } from 'protractor';

import {
  VisualizationOptionsNamesMap,
  VisualizationType,
  // eslint-disable-next-line max-len
} from '../../../src/app/modules/accuracy/components/visualization/network-output/original-image-controls/original-image-controls.component';

import { TestUtils } from './test-utils';

const path = require('path');

export class VisualizeInferenceResultPage {
  until = protractor.ExpectedConditions;
  testUtils: TestUtils;

  constructor() {
    this.testUtils = new TestUtils();
  }

  get performTab() {
    return TestUtils.getElementByDataTestId('perform-tab');
  }

  get testRibbon() {
    return TestUtils.getElementByDataTestId('test-ribbon');
  }

  get testImageFile() {
    return TestUtils.getElementByDataTestId('test-image');
  }

  get selectImageBtn() {
    return TestUtils.getElementByDataTestId('select-image');
  }

  get testImageBtn() {
    return TestUtils.getElementByDataTestId('image-test');
  }

  get labelsSet() {
    return TestUtils.getElementByDataTestId('labels-sets');
  }

  get predictionLabel() {
    return TestUtils.getElementByDataTestId('prediction-label');
  }

  get predictionConfidence() {
    return TestUtils.getElementByDataTestId('prediction-confidence');
  }

  get thresholdControlArea() {
    return TestUtils.getElementByDataTestId('threshold-control');
  }

  get predictionsTable() {
    return TestUtils.getElementByDataTestId('predictions-table');
  }

  get optimizedModelPredictionsContainer() {
    return TestUtils.getElementByDataTestId('optimized-model-predictions');
  }

  get parentModelPredictionsContainer() {
    return TestUtils.getElementByDataTestId('parent-model-predictions');
  }

  get predictionsBadges(): ElementArrayFinder {
    return element.all(by.className('prediction-badge'));
  }

  get predictionTableItems(): ElementArrayFinder {
    return this.predictionsTable.all(by.css('tr'));
  }

  get visualizationTypesField(): ElementFinder {
    return TestUtils.getElementByDataTestId('visualizationtype-form-field');
  }

  get explanationMaskNotSelectedContainer(): ElementFinder {
    return TestUtils.getElementByDataTestId('explanation-mask-not-selected');
  }

  get explanationMask(): ElementFinder {
    return TestUtils.getElementByDataTestId('explanation-mask');
  }

  get visualizationCancelButton(): ElementFinder {
    return TestUtils.getElementByDataTestId('visualization-cancel-button');
  }

  get visualizationProgress(): ElementFinder {
    return TestUtils.getElementByDataTestId('visualization-progress');
  }

  get resultCanvas(): ElementFinder {
    const canvasContainer = element.all(by.className('wb-panel output-panel')).get(0);
    return TestUtils.getNestedElementByDataTestId(canvasContainer, 'image-canvas');
  }

  get inputCanvas(): ElementFinder {
    const canvasContainer = element.all(by.className('wb-panel input-panel')).get(0);
    return TestUtils.getNestedElementByDataTestId(canvasContainer, 'image-canvas');
  }

  get visualizationConfigurationContainer() {
    return TestUtils.getElementByDataTestId('visualization-configuration');
  }

  get inverseMaskRadioButtonGroup() {
    return element(by.id('inverse_mask'));
  }

  async selectTestRibbon() {
    await this.performTab.click();

    await browser.wait(this.until.presenceOf(this.testRibbon));
    await this.testUtils.clickElement(this.testRibbon);
    await browser.sleep(1000);
  }

  async uploadTestImage(fileToUpload: { pathToImage: string }): Promise<void> {
    await this.testUtils.makeFileInputVisible(this.testImageFile);
    await browser.wait(this.until.visibilityOf(this.testImageFile), browser.params.defaultTimeout);

    const testImageFileAbsolutePath = path.resolve(
      __dirname,
      browser.params.precommit_scope.resource_dir,
      fileToUpload.pathToImage
    );

    await this.testImageFile.sendKeys(testImageFileAbsolutePath);
    await browser.sleep(1000);
  }

  async testImage(fileToUpload: { pathToImage: string }, checkPredictionsTable = true) {
    await this.uploadTestImage(fileToUpload);

    await this.testUtils.clickElement(this.testImageBtn);
    await browser.sleep(4000);
    await browser.waitForAngularEnabled(false);
    if (checkPredictionsTable) {
      await browser.wait(
        this.until.presenceOf(this.predictionsTable),
        browser.params.defaultTimeout,
        'Predictions table is not present'
      );
    }
  }

  async checkForThresholdArea() {
    await browser.wait(this.until.visibilityOf(this.thresholdControlArea), browser.params.defaultTimeout);
    expect(this.thresholdControlArea.isPresent()).toBeTruthy('Threshold control area is not present');
  }

  async setThreshold(threshold: string): Promise<void> {
    const thresholdArea: ElementFinder = await this.thresholdControlArea;
    await this.checkForThresholdArea();

    const el = await thresholdArea.element(by.className('mat-select'));
    await this.testUtils.selectValueFromDropdown(el, threshold);
  }

  async checkImageLabel(confidence: number) {
    const label: string = await TestUtils.getElementByDataTestId('prediction-label').getText();
    expect(label).toBeTruthy('Label is not present');

    const actualConfidenceRaw: string = await TestUtils.getElementByDataTestId('prediction-confidence').getText();
    const regExp = new RegExp('[0-9]+.+[0-9]+', 'g');
    const actualConfidence = actualConfidenceRaw.match(regExp);
    if (!actualConfidence[0]) {
      throw new Error('No confidence was found');
    }
    expect(+actualConfidence[0]).toBeGreaterThan(confidence);
  }

  async clickAllBadges(elements: ElementFinder[]): Promise<void> {
    for (const el of elements) {
      await this.testUtils.clickElement(el);
    }
    await browser.sleep(1000);
    // Click on canvas for remove hover effect from last clicked badge
    const canvas: ElementFinder = await element.all(by.css('canvas')).get(0);
    canvas.click();
  }

  async getPredictionValues(parent: ElementFinder, elementSelector: string = 'prediction-class'): Promise<string[]> {
    const predictionClasses: string[] = [];

    const elements = await TestUtils.getAllNestedElementsByDataTestId(parent, elementSelector);
    for (const el of elements) {
      if (el instanceof ElementFinder) {
        const predictionClass = await el.getText();
        predictionClasses.push(predictionClass.replace(/\D/g, ''));
      }
    }

    return predictionClasses;
  }

  async arePredictionsEqualToExpectations(
    elementSelector: string,
    predictions: string | string[],
    topN?: number
  ): Promise<boolean> {
    const table: ElementFinder = await this.predictionsTable;
    await browser.wait(this.until.visibilityOf(table));
    let predictionClasses = await this.getPredictionValues(table, elementSelector);

    console.log(`EXPECTED PREDICTIONS: [${predictions}]. ACTUAL PREDICTIONS: [${predictionClasses}]`);

    if (typeof predictions === 'string') {
      return predictionClasses.every((predictionClass) => predictionClass === predictions);
    }
    if (topN) {
      predictionClasses = predictionClasses.slice(0, topN);
    }
    return predictionClasses.every((predictionClass) => predictions.includes(predictionClass));
  }

  async isCanvasDifferentFromReference(
    expectedImageFile: { pathToImage: string },
    model: { name: string },
    badges?: ElementFinder[],
    options?: PixelmatchOptions,
    imageName?: string
  ): Promise<boolean> {
    const resultCanvas: ElementFinder = badges ? await this.inputCanvas : await this.resultCanvas;
    await browser.wait(this.until.presenceOf(resultCanvas), browser.params.defaultTimeout);

    if (badges) {
      await this.clickAllBadges(badges);
      await browser.sleep(2000);
    }

    const pngFromCanvas = await this.testUtils.getPngWithMetadataFromCanvas(resultCanvas);
    const expectedPng = await this.testUtils.getPngWithMetadataFromPath(expectedImageFile);
    return await this.testUtils.areImagesDifferent(
      pngFromCanvas,
      expectedPng,
      imageName ? imageName : browser.currentTest.fullName,
      null,
      options
    );
  }

  async selectVisualizeOutputTabAndCheckConfigContainer(isOMZ = false) {
    await this.selectTestRibbon();
    await this.checkConfigContainer(isOMZ);
  }

  async checkConfigContainer(isOMZ = false) {
    const isVisualizationConfigPresent = await this.visualizationConfigurationContainer.isPresent();
    if (isOMZ) {
      expect(isVisualizationConfigPresent).toBeFalsy('Visualization configuration container should NOT be present');
      return;
    }
    expect(isVisualizationConfigPresent).toBeTruthy('Visualization configuration container should be present');
    const panelHeader = this.visualizationConfigurationContainer.all(by.tagName('mat-expansion-panel-header')).first();
    const panelHeaderClasses = await panelHeader.getAttribute('class');
    if (!panelHeaderClasses.includes('mat-expanded')) {
      await panelHeader.click();
      // Timeout for expanding accordion
      await browser.sleep(1000);
    }
  }

  async fillVisualizationConfigurationField(
    dropDownElement: ElementFinder,
    expectedValue: string | undefined,
    paramName: string
  ) {
    expect(await dropDownElement.isPresent()).toBeTruthy(paramName + ' element should be displayed');
    if (expectedValue === undefined) {
      console.warn('No value in resources for ' + paramName + ', preselected used');
      return;
    }
    const selectedValue = await dropDownElement.getText();
    if (selectedValue !== expectedValue) {
      console.warn(
        `Different model ${paramName} selected: ${selectedValue}, setting model ${paramName} from resources`
      );
      await this.testUtils.selectValueFromDropdown(dropDownElement, expectedValue);
    }
  }

  async checkAndSelectInverseMaskRadioButtons(expectedValue: 'Yes' | 'No' | undefined) {
    const radioButtonGroup = this.inverseMaskRadioButtonGroup;
    expect(await radioButtonGroup.isPresent()).toBeTruthy(
      'Inverse mask radio button group element should be displayed'
    );

    if (expectedValue === undefined) {
      console.warn('No value in resources, preselected used');
      return;
    }
    const radioButtons: ElementArrayFinder = radioButtonGroup.all(by.tagName('mat-radio-button'));
    await radioButtons.each(async (el) => {
      const value = await el.getText();
      const classes = await el.getAttribute('class');
      const isChecked = classes.includes('mat-radio-checked');

      if (value === expectedValue && !isChecked) {
        console.warn('Wrong value selected, setting value from resources');
        await el.click();
        return;
      }
    });
  }

  async comparePredictionsAndBadgesWithExpectations(
    model: { name: string },
    expectedImageFile: { pathToImage: string },
    predictions: string | string[],
    expectedBadgesCount: number,
    options?: PixelmatchOptions,
    imageName?: string
  ) {
    await browser.sleep(10000);

    const badges = await this.predictionsBadges;
    const result = await this.arePredictionsEqualToExpectations('prediction-label', predictions);

    expect(result).toBeTruthy('Prediction classes should be equal');
    expect(badges.length).toEqual(expectedBadgesCount, 'Count of prediction should be equal ' + expectedBadgesCount);

    const isImagesDifferent = await this.isCanvasDifferentFromReference(
      expectedImageFile,
      model,
      badges,
      options,
      imageName
    );

    expect(isImagesDifferent).toBeFalsy('Images should be equal');
  }

  async visualizeByType(
    imageFile: { pathToImage: string },
    visualizationType: string,
    shouldCancel?: boolean
  ): Promise<void> {
    await browser.wait(this.until.presenceOf(this.testImageFile), browser.params.defaultTimeout);
    console.log('Upload test image');
    await this.uploadTestImage(imageFile);
    const visualizationTypesField = await this.visualizationTypesField;
    await this.testUtils.selectValueFromDropdown(visualizationTypesField, visualizationType);
    await this.testImageBtn.click();

    // XAI visualization might take time and to avoid getting prompt -> wait
    if (visualizationType === VisualizationOptionsNamesMap[VisualizationType.EXPLAIN] && !shouldCancel) {
      await browser.sleep(20000);
    }

    if (!shouldCancel) {
      const optimizedModelPredictions = this.until.visibilityOf(this.optimizedModelPredictionsContainer);
      const parentModelPredictions = this.until.visibilityOf(this.parentModelPredictionsContainer);
      const predictionsTable = this.until.visibilityOf(this.predictionsTable);

      await browser.wait(
        this.until.or(optimizedModelPredictions, parentModelPredictions, predictionsTable),
        browser.params.defaultTimeout
      );
    }
  }
}
