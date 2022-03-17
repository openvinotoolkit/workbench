import { browser, by, element, ElementFinder, protractor } from 'protractor';

import { TestUtils } from './test-utils';

export class AppPage {
  until = protractor.ExpectedConditions;

  get activeConfigurationsTitle(): ElementFinder {
    return TestUtils.getElementByDataTestId('available-models-table-title');
  }

  get createProjectButton(): ElementFinder {
    return TestUtils.getElementByDataTestId('create-new-project');
  }

  get capabilitiesImage(): ElementFinder {
    return TestUtils.getElementByDataTestId('capabilities-image');
  }

  get availableModelsBlock(): ElementFinder {
    return TestUtils.getElementByDataTestId('available-models-block');
  }

  get homePageButton() {
    return TestUtils.getElementByDataTestId('homeIcon');
  }

  async navigateTo(): Promise<void> {
    await browser.get(browser.baseUrl);
  }

  async getPageTitle(): Promise<string> {
    return browser.getTitle();
  }

  get modelName(): Promise<string> {
    return TestUtils.getElementByDataTestId('model-name').getText() as Promise<string>;
  }

  async openConfigurationWizard(): Promise<void> {
    await this.navigateTo();
    await browser.wait(this.until.presenceOf(this.createProjectButton), browser.params.defaultTimeout);
    await browser.sleep(3000);
    await this.createProjectButton.click();
    console.log('opened create project page');
  }

  async openModelProjectsFromStartPage(modelName: string): Promise<void> {
    await this.navigateTo();
    await browser.sleep(1000);
    // First need to open from the start page
    const card: ElementFinder = await TestUtils.getElementByDataTestId(`model-card_${modelName}`);
    const openBtn: ElementFinder = await TestUtils.getNestedElementByDataTestId(card, 'open-model');
    await browser.wait(this.until.elementToBeClickable(openBtn), browser.params.defaultTimeout);
    await new TestUtils().clickElement(openBtn);
  }

  async openProjectByModelAndDatasetNames(
    modelName: string,
    datasetName: string,
    isInt8: boolean = false
  ): Promise<void> {
    // First need to open from the start page
    await this.openModelProjectsFromStartPage(modelName);
    if (isInt8) {
      modelName = modelName + ' - INT8';
    }

    // Then need to open from the model project tree
    await browser.sleep(1500);
    const rowTestID = `row_${modelName}_${datasetName}`;
    const projectRow: ElementFinder = await TestUtils.getElementByDataTestId(rowTestID);
    const openBtn: ElementFinder = await TestUtils.getNestedElementByDataTestId(projectRow, 'open-project');
    await browser.wait(this.until.elementToBeClickable(openBtn), browser.params.defaultTimeout);
    await new TestUtils().clickElement(openBtn);
  }
}
