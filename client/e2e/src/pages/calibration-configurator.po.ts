import { browser, by, element, ElementFinder, protractor } from 'protractor';

import { OptimizationAlgorithm, OptimizationAlgorithmPreset } from '@store/project-store/project.model';

import { TestUtils } from './test-utils';

export class CalibrationPage {
  until = protractor.ExpectedConditions;

  get int8AccuracyDrop() {
    return element(by.id('loss'));
  }

  get configureAccuracy() {
    return TestUtils.getElementByDataTestId('configure-accuracy');
  }

  get calibrateBtn() {
    return TestUtils.getElementByDataTestId('calibrate-btn');
  }

  get imagesSubsetField() {
    return element(by.id('subsetSize'));
  }

  get defaultAlgorithmOption() {
    return element(by.id(OptimizationAlgorithm.DEFAULT));
  }

  get accuracyAwareAlgorithmOption() {
    return element(by.id(OptimizationAlgorithm.ACCURACY_AWARE));
  }

  get chooseAnotherConfig() {
    return TestUtils.getElementByDataTestId('choose-another-config');
  }

  get toProjectsByModelButton() {
    return TestUtils.getElementByDataTestId('breadcrumb-to-projects-by-model');
  }

  async fillAccuracyDrop(drop) {
    await browser.wait(() => browser.isElementPresent(this.int8AccuracyDrop), browser.params.defaultTimeout);
    console.log('Start Fill Accuracy Drop');
    await browser.sleep(1000);
    await this.int8AccuracyDrop.clear();
    await this.int8AccuracyDrop.sendKeys(drop);
  }

  async fillSubset(percentage) {
    await browser.wait(this.until.presenceOf(this.imagesSubsetField), browser.params.defaultTimeout);
    await browser.sleep(1000);
    await this.imagesSubsetField.clear();
    await this.imagesSubsetField.sendKeys(percentage);
  }

  async validatePresetDescription(preset: OptimizationAlgorithmPreset) {
    const text: string = await TestUtils.getElementByDataTestId(`${preset}-text`).getText();
    expect(text.trim()).toBeTruthy('Preset description is empty/not present.');
    await console.log(`${preset} preset description is validated.`);
  }

  async choosePreset(preset: OptimizationAlgorithmPreset) {
    const presetEl: ElementFinder = await TestUtils.getElementByDataTestId(preset);
    await this.validatePresetDescription(preset);
    await browser.wait(() => browser.isElementPresent(presetEl), browser.params.defaultTimeout);
    await new TestUtils().clickElement(presetEl);
    await console.log(`${preset} preset is chosen.`);
  }
}
