import { browser, by, element, ElementFinder, protractor } from 'protractor';

import { WebdriverWebElement } from 'protractor/built/element';

import { ModelTaskTypeNames } from '@store/model-store/model.model';

import { TestUtils } from './test-utils';

const REQUIRED_PLACEHOLDER = 'REQUIRED';

export class AdvancedAccuracyConfigurationPage {
  testUtils: TestUtils;
  public elements = {
    toggleAccuracyMode: TestUtils.getElementByDataTestId('switch-between-target-platform'),
    isConfigurationValidStatus: TestUtils.getElementByDataTestId('VALID'),
    isConfigurationNotValidStatus: TestUtils.getElementByDataTestId('INVALID'),
    showErrorInfoButton: TestUtils.getElementByDataTestId('show-error-info'),
    errorMessages: TestUtils.getAllElementsByDataTestId('error-message'),
    // The syntax errors that come from editor do not have the test id
    syntaxErrorsInEditor: element(by.className('error-messages')),
    allEditorLines: element.all(by.className('view-line')),
    confirmToBasic: TestUtils.getElementByDataTestId('confirm'),
    schemaContainer: TestUtils.getElementByDataTestId('schema-container'),
    editorContainer: TestUtils.getElementByDataTestId('editor-container'),
    editAccuracyBtn: TestUtils.getElementByDataTestId('edit-accuracy'),
    taskTypeFormField: TestUtils.getElementByDataTestId('tasktype-form-field'),
    saveAccuracyBtn: TestUtils.getElementByDataTestId('save-accuracy'),
    async getAccuracyBtn(projectRow: ElementFinder): Promise<ElementFinder> {
      return TestUtils.getNestedElementByDataTestId(projectRow, 'edit-accuracy');
    },
  };
  private until = protractor.ExpectedConditions;

  constructor(originTestUtils?) {
    this.testUtils = originTestUtils || new TestUtils();
  }

  async isConfigurationValid(): Promise<boolean> {
    const isValidElement = this.until.visibilityOf(this.elements.isConfigurationValidStatus);
    const isNotValidElement = this.until.visibilityOf(this.elements.isConfigurationNotValidStatus);

    await browser.wait(this.until.or(isNotValidElement, isValidElement), browser.params.defaultTimeout);

    return (
      (await this.elements.isConfigurationValidStatus.isPresent()) &&
      !(await this.elements.isConfigurationNotValidStatus.isPresent())
    );
  }

  async placeCursorAtTheEndOfTheEditor(): Promise<void> {
    // Get the last line - it should be empty
    const lastLine: ElementFinder = await this.elements.allEditorLines.last();
    // Click on it so that the cursor is there
    await this.testUtils.clickElement(lastLine);
  }

  async sendTextToEditor(text: string): Promise<void> {
    // Get the current active element
    const activeField: WebdriverWebElement = await browser.driver.switchTo().activeElement();
    await activeField.sendKeys(text);
  }

  async getCurrentConfigFromEditor(): Promise<string[]> {
    const lines: string[] = [];

    for (const line of await this.elements.allEditorLines) {
      lines.push(await line.getText());
    }

    return lines;
  }

  async goToAccuracyConfiguration(isAdvanced: boolean = false): Promise<void> {
    // Go to 'Perform' tab for the selected project
    await this.testUtils.clickElement(this.testUtils.inferenceCard.performTab);
    await browser.sleep(1000);

    // Select accuracy report ribbon
    await this.testUtils.clickElement(this.testUtils.accuracyReport.elements.createAccuracyRibbon);
    await browser.sleep(500);

    if (isAdvanced) {
      await browser.waitForAngularEnabled(false);
    }
    await this.testUtils.clickElement(this.testUtils.accuracyReport.elements.provideAccuracyConfig);
    await browser.sleep(1500);
  }

  async goFromBasicToAdvanced(): Promise<void> {
    await this.elements.toggleAccuracyMode.click();
    // Disable waiting as editor blocks page-Protractor interaction
    await browser.waitForAngularEnabled(false);
    await browser.sleep(1500);
  }

  async goFromAdvancedToBasic(): Promise<void> {
    await browser.waitForAngularEnabled(false);
    await new TestUtils().clickElement(this.elements.toggleAccuracyMode);
    await new TestUtils().clickElement(this.elements.confirmToBasic);
    await browser.sleep(1500);
    // Enabling waiting because of leaving page with editor
    await browser.refresh();
    await browser.sleep(1500);
    await browser.waitForAngularEnabled(true);
  }

  async isSaveAccuracyButtonEnabled(): Promise<boolean> {
    await browser.wait(this.until.visibilityOf(this.elements.saveAccuracyBtn), 5000);
    const btnClasses: string = await this.elements.saveAccuracyBtn.getAttribute('class');
    return btnClasses.indexOf('disabled') === -1;
  }

  async clickSaveAccuracy(isAdvanced: boolean = false): Promise<void> {
    await this.testUtils.clickElement(this.elements.saveAccuracyBtn);
    await browser.sleep(2000);
    // Enable waiting for Angular if from page with editor
    if (isAdvanced) {
      await browser.waitForAngularEnabled(true);
      await browser.sleep(1000);
      await browser.refresh();
      await browser.sleep(2000);
    }
  }

  async isAdvancedAccuracyOpened(): Promise<boolean> {
    return (await this.elements.schemaContainer.isPresent()) && (await this.elements.editorContainer.isPresent());
  }

  async toggleShowingErrors(): Promise<void> {
    await new TestUtils().clickElement(this.elements.showErrorInfoButton);
    await browser.sleep(1000);
  }

  async areErrorsShown(): Promise<boolean> {
    await browser.wait(this.until.visibilityOf(this.elements.errorMessages.first()));
    return this.elements.errorMessages.isPresent();
  }

  async getErrorMessageText(type: string): Promise<string> {
    // "Syntax" errors from editor do not have `data-test-id`
    // Those related to accuracy "configuration" validation, have `data-test-id`
    switch (type) {
      case 'syntax':
        return this.elements.syntaxErrorsInEditor.getText();
      case 'configuration':
        return this.elements.errorMessages.first().getText();
    }
  }

  async getEditorLineByIndex(index: number): Promise<ElementFinder> {
    const { allEditorLines } = this.elements;
    return allEditorLines.get(index);
  }

  async replaceRequiredPlaceholderByIndex(index: number, string: string): Promise<ElementFinder> {
    const line: ElementFinder = await this.getEditorLineByIndex(index);
    await new TestUtils().clickElement(line);
    const activeField: WebdriverWebElement = await browser.driver.switchTo().activeElement();
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < REQUIRED_PLACEHOLDER.length; i++) {
      await activeField.sendKeys(protractor.Key.BACK_SPACE);
    }
    await activeField.sendKeys(string);
  }

  async clearEditorLineByIndex(index: number): Promise<void> {
    const line: ElementFinder = await this.getEditorLineByIndex(index);
    await new TestUtils().clickElement(line);
    const activeField: WebdriverWebElement = await browser.driver.switchTo().activeElement();
    const text = await line.getText();
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < text.trim().length; i++) {
      await activeField.sendKeys(protractor.Key.BACK_SPACE);
    }
  }

  async changeTaskTypeAccuracyConfiguration(taskType: ModelTaskTypeNames): Promise<void> {
    await browser.wait(this.elements.taskTypeFormField.isPresent());
    await this.testUtils.configurationWizard.selectValueFromDropdown(this.elements.taskTypeFormField, taskType);
  }
}
