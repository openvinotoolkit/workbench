import { browser, by, element, ElementArrayFinder, ElementFinder, protractor } from 'protractor';

import { TestUtils } from './test-utils';
import { ModelFile } from './model-file';
import { OMZModelPrecisionEnum } from '../../../src/app/modules/model-manager/components/omz-import-ribbon-content/omz-import-ribbon-content.component';

export const filterGroupNames = ['task', 'library', 'model-type', 'language', 'license'];
type FilterGroupName = typeof filterGroupNames[number];
const details = ['domain', 'library', 'tasks', 'languages', 'licenses', 'downloads', 'updated'];
type Detail = typeof details[number];

export class HFModelDownloadPage {
  private until = protractor.ExpectedConditions;

  private readonly elements = {
    HFTab: TestUtils.getElementByDataTestId('hugging_face'),
    searchField: TestUtils.getNestedElementByDataTestId(
      TestUtils.getElementByDataTestId('search-form-field'),
      'search'
    ),
    modelCard: TestUtils.getElementByDataTestId('model-card'),
    modelCards: TestUtils.getAllElementsByDataTestId('model-card'),
    modelDescription: TestUtils.getElementByDataTestId('model-description'),
    downloadButton: TestUtils.getElementByDataTestId('download-and-import'),
    precisionContainer: TestUtils.getElementByDataTestId('datatype-form-field'),
    convertButton: TestUtils.getElementByDataTestId('convert-button'),
    resetFiltersButton: TestUtils.getElementByDataTestId('reset-filters'),
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
  async openHFTab(): Promise<void> {
    await new TestUtils().clickElement(this.elements.HFTab);
    await browser.wait(this.until.visibilityOf(await this.getFirstModelCard()), browser.params.defaultTimeout);
  }

  async countModelCards(): Promise<number> {
    return this.elements.modelCards.count();
  }

  // Assuming only one model card is present
  async getModelNameFromCard(): Promise<string> {
    const modelCardElement = await this.getFirstModelCard();
    return TestUtils.getNestedElementByDataTestId(modelCardElement, 'model-name').getText();
  }

  async getFirstModelCard(): Promise<ElementFinder> {
    return this.elements.modelCard;
  }

  async isElementAvailable(modelCardElement: ElementFinder): Promise<boolean> {
    const classes = await modelCardElement.getAttribute('class');

    return !classes.includes('disabled');
  }

  async filterModelCardsByName(modelName: string): Promise<ElementFinder> {
    await this.elements.searchField.clear();
    await this.elements.searchField.sendKeys(modelName);
    await browser.sleep(1000);
    await browser.wait(async () => {
      const modelCardModelName = await this.getModelNameFromCard();
      return modelCardModelName === modelName;
    }, browser.params.defaultTimeout);
    return this.getFirstModelCard();
  }

  async expandFilterGroup(groupName: FilterGroupName): Promise<void> {
    const groupContainer: ElementFinder = await this.elements.getFilterGroup(groupName);
    const showMoreElement: ElementFinder = TestUtils.getNestedElementByDataTestId(groupContainer, 'show-more');
    await new TestUtils().clickElement(showMoreElement);
    await browser.sleep(1000);
  }

  async countFiltersByGroup(groupName: FilterGroupName): Promise<number> {
    const groupContainer: ElementFinder = await this.elements.getFilterGroup(groupName);
    const filterElements: ElementArrayFinder = TestUtils.getNestedElementsContainingDataTestIdPart(
      groupContainer,
      '-filter'
    );
    return filterElements.count();
  }

  // This is applicable to the Model Types, Languages, Licenses, i.e., 'bert', 'en',
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
    await browser.wait(async () => !(await this.isElementAvailable(this.elements.resetFiltersButton)));
    await browser.sleep(500);
  }

  async checkModelDetails(): Promise<void> {
    const modelDescription: string = await this.elements.modelDescription.getText();

    // Verify that text exists
    expect(modelDescription.length).toBeGreaterThan(0);

    // Verify the external links pop-ups
    await new TestUtils().checkExternalLinkDialogWindow(this.elements.modelDescription);

    // Model features
    for (const detail of details) {
      const detailValue: string = await this.elements.getDetailsParameterValue(detail);
      expect(detailValue.length).toBeTruthy();
    }
  }

  // This function is expected to run from the Model Manager
  async selectAndDownloadModel(modelName: string): Promise<void> {
    await this.openHFTab();
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

  async convertDownloadedModelToIR(
    precision?: OMZModelPrecisionEnum,
    configurationMultiplier: number = 4
  ): Promise<void> {
    // Wait for the environment preparing to complete
    console.log('Waiting for environment preparation to complete.');
    await browser.wait(
      async () => await this.isImportStageComplete('prepare-environment-stage'),
      browser.params.defaultTimeout * configurationMultiplier,
      'Import stage is not complete'
    );

    // Wait for the download from HF and conversion to ONNX
    console.log('Waiting for download from HF to ONNX stage to complete.');
    await browser.wait(
      async () => await this.isImportStageComplete('download-from-huggingface'),
      browser.params.defaultTimeout * configurationMultiplier,
      'ONNX conversion stage is not complete'
    );

    if (precision) {
      if (precision !== OMZModelPrecisionEnum.FP16) {
        await this.selectPrecision(precision);
      } else {
        console.log('select FP16');
        await browser.sleep(2000);
      }
    } else {
      await this.selectPrecision(OMZModelPrecisionEnum.FP32);
    }

    await browser.wait(this.until.elementToBeClickable(this.elements.convertButton), browser.params.defaultTimeout * 3);

    await new TestUtils().clickElement(this.elements.convertButton);

    console.log('Waiting for conversion in IR.');
    await browser.wait(
      async () => await this.isImportStageComplete('convert-stage'),
      browser.params.defaultTimeout * configurationMultiplier,
      'Conversion stage is not complete'
    );
  }

  async selectDownloadConvertModel(modelFile: ModelFile) {
    await this.selectAndDownloadModel(modelFile.name);
    await this.convertDownloadedModelToIR(modelFile.conversionSettings.precision);
    await new TestUtils().modelManagerPage.configureLayouts(modelFile, true, true);
    await browser.wait(
      () => new TestUtils().configurationWizard.isUploadReady(modelFile.name),
      browser.params.defaultTimeout * 9
    );
    console.log(`Hugging Face ${modelFile.name} is ready.`);
  }
}
