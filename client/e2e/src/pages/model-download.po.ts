import { browser, by, element, ElementFinder, protractor } from 'protractor';

import { ModelPrecisionEnum } from '@store/model-store/model.model';

import { TestUtils } from './test-utils';

export class ModelDownloadPage {
  until = protractor.ExpectedConditions;

  private readonly elements = {
    OMZTab: TestUtils.getElementByDataTestId('open_model_zoo'),
    searchField: TestUtils.getNestedElementByDataTestId(
      TestUtils.getElementByDataTestId('search-form-field'),
      'search'
    ),
    modelCard: TestUtils.getElementByDataTestId('model-card'),
    modelCards: TestUtils.getAllElementsByDataTestId('model-card'),
    modelDescription: TestUtils.getElementByDataTestId('model-description'),
    modelLicense: TestUtils.getElementByDataTestId('model-license'),
    downloadButton: TestUtils.getElementByDataTestId('download-and-import'),
    precisionContainer: element(by.id('dataType')),
    convertButton: element(by.buttonText('Convert')),
    // Assuming only one model card is present
    async getModelNameFromCard(): Promise<string> {
      const modelCardElement = await this.modelCard;
      return TestUtils.getNestedElementByDataTestId(modelCardElement, 'model-name').getText();
    },
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
    detailsFrameworkParameter: TestUtils.getElementByDataTestId('framework-detail'),
    detailsTaskParameter: TestUtils.getElementByDataTestId('task-detail'),
    detailsDomainParameter: TestUtils.getElementByDataTestId('domain-detail'),
    detailsPrecisionParameter: TestUtils.getElementByDataTestId('precision-detail'),
    async getDetailsParameterValue(detailsParameterElement: ElementFinder): Promise<string> {
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

  async filterModelCards(modelName: string): Promise<ElementFinder> {
    await this.elements.searchField.sendKeys(modelName);
    await browser.sleep(1000);
    // TODO: unskip once filters are introduced
    // expect(await this.elements.modelCards.count()).toEqual(1);
    await browser.wait(async () => {
      const modelCardModelName = await this.elements.getModelNameFromCard();
      return modelCardModelName === modelName;
    }, browser.params.defaultTimeout);
    return this.elements.modelCard;
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
    const framework = await this.elements.getDetailsParameterValue(this.elements.detailsFrameworkParameter);
    const task = await this.elements.getDetailsParameterValue(this.elements.detailsTaskParameter);
    const domain = await this.elements.getDetailsParameterValue(this.elements.detailsDomainParameter);
    const precision = await this.elements.getDetailsParameterValue(this.elements.detailsPrecisionParameter);
    const modelFeatures = [framework, task, domain, precision];
    for (const modelFeature of modelFeatures) {
      expect(modelFeature.length).toBeTruthy();
    }
  }

  // This function is expected to run from the Model Manager
  async selectAndDownloadModel(modelName: string): Promise<void> {
    await this.openOMZTab();
    const modelCard = await this.filterModelCards(modelName);
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
