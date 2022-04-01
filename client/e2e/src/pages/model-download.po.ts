import { browser, by, element, ElementArrayFinder, ElementFinder, protractor } from 'protractor';

import { ModelPrecisionEnum } from '@store/model-store/model.model';

import { TestUtils } from './test-utils';

export const filterGroupNames = ['task-type', 'precision', 'framework'];
type FilterGroupName = typeof filterGroupNames[number];
const details = ['framework', 'task', 'domain', 'precision'];
type Detail = typeof details[number];

export class ModelDownloadPage {
  until = protractor.ExpectedConditions;

  private readonly elements = {
    // TODO: change test-id
    OMZTab: TestUtils.getElementByDataTestId('open_model_zoo_(v2)'),
    searchField: TestUtils.getNestedElementByDataTestId(
      TestUtils.getElementByDataTestId('search-form-field'),
      'search'
    ),
    modelCard: TestUtils.getElementByDataTestId('model-card'),
    modelCards: TestUtils.getAllElementsByDataTestId('model-card'),
    modelDescription: TestUtils.getElementByDataTestId('model-description'),
    modelLicense: TestUtils.getElementByDataTestId('model-license'),
    downloadButton: TestUtils.getElementByDataTestId('download-and-import'),
    precisionContainer: TestUtils.getElementByDataTestId('datatype-form-field'),
    convertButton: element(by.buttonText('Convert')),
    resetFiltersButton: TestUtils.getElementByDataTestId('reset-filters'),
    // Assuming only one model card is present
    async getModelContentFromCard(): Promise<{ precisions: string; taskType: string; framework: string }> {
      const modelCardElement = await this.modelCard;
      const modelContentElement = TestUtils.getNestedElementByDataTestId(modelCardElement, 'model-content');
      return {
        precisions: await TestUtils.getNestedElementByDataTestId(modelContentElement, 'precision'),
        taskType: await TestUtils.getNestedElementByDataTestId(modelContentElement, 'task-type'),
        framework: await TestUtils.getNestedElementByDataTestId(modelContentElement, 'framework'),
      };
    },
    async getFilterGroup(groupName: FilterGroupName): Promise<ElementFinder> {
      return TestUtils.getElementByDataTestId(`${groupName}-filter-group`);
    },
    async getDetailsParameterValue(detailName: Detail): Promise<string> {
      const detailsParameterElement: ElementFinder = TestUtils.getElementByDataTestId(`${detailName}-detail`);
      const valueElement = TestUtils.getNestedElementByDataTestId(detailsParameterElement, 'value');
      return valueElement.getText();
    },
  };

  // This should be run on the Model Manager page
  async openOMZTab(): Promise<void> {
    await new TestUtils().clickElement(this.elements.OMZTab);
    await browser.wait(this.until.presenceOf(this.elements.modelCard), browser.params.defaultTimeout);
  }

  async countModelCards(): Promise<number> {
    return this.elements.modelCards.count();
  }

  async filterModelCardsByName(modelName: string): Promise<ElementFinder> {
    await this.elements.searchField.sendKeys(modelName);
    await browser.sleep(1000);
    await browser.wait(async () => {
      const modelCardModelName = await this.getModelNameFromCard();
      return modelCardModelName === modelName;
    }, browser.params.defaultTimeout);
    return this.elements.modelCard;
  }

  // Assuming only one model card is present
  async getModelNameFromCard(): Promise<string> {
    const modelCardElement = await this.elements.modelCard;
    return TestUtils.getNestedElementByDataTestId(modelCardElement, 'model-name').getText();
  }

  // This is applicable to the Task Types, Precisions, Frameworks, i.e., 'classification', 'INT8',
  // and similar are valid options to pass
  async selectFilter(filterName: string): Promise<void> {
    const filterElement: ElementFinder = TestUtils.getElementByDataTestId(`${filterName}-filter`);
    await new TestUtils().clickElement(filterElement);
    await browser.sleep(1000);
  }

  async removeFilter(filterName: string): Promise<void> {
    const filterElement: ElementFinder = TestUtils.getElementByDataTestId(`${filterName}-filter`);
    const removeFilterElement: ElementFinder = TestUtils.getNestedElementByDataTestId(filterElement, 'remove-filter');
    await new TestUtils().clickElement(removeFilterElement);
    await browser.sleep(1000);
  }

  async resetFilters(): Promise<void> {
    await new TestUtils().clickElement(this.elements.resetFiltersButton);
    await browser.wait(this.until.invisibilityOf(this.elements.resetFiltersButton));
    await browser.sleep(500);
  }

  async countFiltersByGroup(groupName: FilterGroupName): Promise<number> {
    const groupContainer: ElementFinder = await this.elements.getFilterGroup(groupName);
    const filterElements: ElementArrayFinder = TestUtils.getNestedElementsContainingDataTestIdPart(
      groupContainer,
      '-filter'
    );
    return filterElements.count();
  }

  async checkModelDetails(): Promise<void> {
    const modelDescription: string = await this.elements.modelDescription.getText();
    const modelLicense: string = await this.elements.modelLicense.getText();

    // Verify that text exists
    expect(modelDescription.length).toBeGreaterThan(0);
    expect(modelLicense.length).toBeGreaterThan(0);

    // Verify the external links pop-ups
    await new TestUtils().checkExternalLinkDialogWindow(this.elements.modelDescription);
    await new TestUtils().checkExternalLinkDialogWindow(this.elements.modelLicense);

    // Model features
    for (const detail of details) {
      const detailValue: string = await this.elements.getDetailsParameterValue(detail);
      expect(detailValue.length).toBeTruthy();
    }
  }

  // This function is expected to run from the Model Manager
  async selectAndDownloadModel(modelName: string): Promise<void> {
    await this.openOMZTab();
    const modelCard = await this.filterModelCardsByName(modelName);
    await new TestUtils().clickElement(modelCard);
    // Check description, license and model features
    await this.checkModelDetails();

    await new TestUtils().clickElement(this.elements.downloadButton);
  }

  async selectValueFromDropdown(dropdownElement: ElementFinder, value: string): Promise<void> {
    await browser.sleep(1000);
    await browser.wait(this.until.elementToBeClickable(dropdownElement), browser.params.defaultTimeout * 3);
    await dropdownElement.click();
    const optionElement = element(by.cssContainingText('.mat-option-text', value));
    const optionsPresent = this.until.presenceOf(optionElement);
    const optionsClickable = this.until.elementToBeClickable(optionElement);
    await browser.wait(this.until.and(optionsPresent, optionsClickable), browser.params.defaultTimeout);
    await optionElement.click();
  }

  async selectPrecision(type: string) {
    await this.selectValueFromDropdown(this.elements.precisionContainer, type);
  }

  async clickConvertButton() {
    await this.elements.convertButton.click();
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

  async convertDownloadedModelToIR(precision?: ModelPrecisionEnum, configurationMultiplier: number = 4): Promise<void> {
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

    await browser.wait(this.until.elementToBeClickable(this.elements.convertButton), browser.params.defaultTimeout * 3);
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
