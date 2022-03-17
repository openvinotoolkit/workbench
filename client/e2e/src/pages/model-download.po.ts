import { browser, by, element, ElementFinder, protractor } from 'protractor';

import { ModelPrecisionEnum } from '@store/model-store/model.model';

import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';

import { ModelDownloaderTableComponent } from '../../../src/app/modules/model-manager/components/model-downloader-table/model-downloader-table.component';
import { TestUtils } from './test-utils';

export class ModelDownloadPage {
  until = protractor.ExpectedConditions;

  get modelDownloadTable() {
    return element(by.id('model-download-table'));
  }

  get downloadButton() {
    return TestUtils.getElementByDataTestId('download-btn');
  }

  get precisionContainer() {
    return element(by.id('dataType'));
  }

  get convertButton() {
    return element(by.buttonText('Convert'));
  }

  get openVinoModelsPrecision() {
    return element(by.id('precision'));
  }

  get selectFilterColumnField() {
    return TestUtils.getElementByDataTestId('select-column-field');
  }

  get setFilterField() {
    return TestUtils.getElementByDataTestId('set-filter-field');
  }

  get applyFilterButton() {
    return TestUtils.getElementByDataTestId('apply-filter-button');
  }

  get searchInput() {
    return TestUtils.getElementByDataTestId('search-input');
  }

  downloadTableElementsCount() {
    return element.all(by.className('mat-row')).count();
  }

  async filterTable(modelName) {
    const selectColumnField = await this.selectFilterColumnField;
    const setFilterField = await this.setFilterField;

    await this.selectValueFromDropdown(selectColumnField, 'Model Name');
    await browser.sleep(1000);

    await this.selectValueFromDropdown(setFilterField, modelName, true);
    await browser.sleep(1000);

    await browser.actions().mouseMove(this.applyFilterButton).click().perform();
    await this.applyFilterButton.click();
  }

  async downloadModel(modelName, precision = ModelPrecisionEnum.FP16, framework?) {
    // Reassign precision with default value for explicitly passed parameters such as null
    if (!precision) {
      precision = ModelPrecisionEnum.FP32;
    }
    let row;
    if (modelName) {
      await browser.wait(() => {
        return browser.isElementPresent(element(by.cssContainingText('td#model-name', modelName)));
      }, browser.params.defaultTimeout);

      const modelRowId = ModelDownloaderDTO.getId(modelName, ModelDownloaderTableComponent.omzModelRowClassPrefix);
      row = await element(by.id(modelRowId)).all(by.css('td')).first();
    } else {
      row = element.all(by.className('table-row')).first().element(by.css('td')).first();
      modelName = await row.all(by.className('model-name')).first().getText();
    }
    await row.click();

    await browser.wait(this.until.elementToBeClickable(this.downloadButton), browser.params.defaultTimeout);
    await this.downloadButton.click();
    return modelName;
  }

  async selectValueFromDropdown(el: ElementFinder, value: string, isFiltered: boolean = false) {
    await browser.sleep(1000);
    await browser.wait(this.until.elementToBeClickable(el), browser.params.defaultTimeout * 3);
    await el.click();
    if (isFiltered) {
      console.log('Filtered table');
      const searchInput = await this.searchInput;
      await searchInput.clear();
      await searchInput.sendKeys(value);
      console.log(`Search ${value}`);
      await browser.sleep(500);
    }
    const optionElement = element(by.cssContainingText('.mat-option-text', value));
    const optionsPresent = this.until.presenceOf(optionElement);
    const optionsClickable = this.until.elementToBeClickable(optionElement);
    await browser.wait(this.until.and(optionsPresent, optionsClickable), browser.params.defaultTimeout);
    await optionElement.click();
  }

  async selectPrecision(type: string) {
    await this.selectValueFromDropdown(this.precisionContainer, type);
  }

  async clickConvertButton() {
    await this.convertButton.click();
  }

  async isImportStageComplete(tabID: string): Promise<boolean> {
    const tabElement: ElementFinder = await TestUtils.getElementByDataTestId(tabID);
    const completeIcon: ElementFinder = await TestUtils.getNestedElementByDataTestId(tabElement, 'model-status-ready');
    const errorIcon: ElementFinder = await TestUtils.getElementByDataTestId('model-status-error');
    // TODO 58142
    if ((await errorIcon.isPresent()) && browser.params.isNightly) {
      throw new Error('Failed to download');
    }
    return completeIcon.isPresent();
  }

  async convertDownloadedModelToIR(precision?, configurationMultiplier = 4) {
    // Wait for the model uploading to complete
    console.log('Waiting for model uploading to complete.');
    await browser.wait(
      async () => await this.isImportStageComplete('model-upload-tab'),
      browser.params.defaultTimeout * configurationMultiplier
    );

    // Wait for the environment preparing to complete
    console.log('Waiting for environment preparation to complete.');
    await browser.wait(
      async () => await this.isImportStageComplete('prepare-environment-stage'),
      browser.params.defaultTimeout * configurationMultiplier,
      'Import stage is not complete'
    );

    if (precision) {
      if (precision !== ModelPrecisionEnum.FP16) {
        await this.selectPrecision(precision);
      } else {
        console.log('select FP16');
        await browser.sleep(2000);
      }
    } else {
      await this.selectPrecision(ModelPrecisionEnum.FP32);
    }

    await browser.wait(this.until.elementToBeClickable(this.convertButton), browser.params.defaultTimeout * 3);
    let currentUrl = '';
    await browser.wait(async () => {
      await this.clickConvertButton();
      await console.log('Convert button is clicked');
      await browser.sleep(1000);
      currentUrl = await browser.getCurrentUrl();
      return currentUrl.includes('model-manager/import');
    }, browser.params.defaultTimeout);
  }
}
