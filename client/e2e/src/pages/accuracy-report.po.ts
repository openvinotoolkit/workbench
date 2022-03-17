import { browser, ElementFinder, protractor } from 'protractor';

import {
  AccuracyReportType,
  ClassificationReportEntityKey,
  DetectionReportEntityKey,
  TensorDistanceReportEntityKey,
} from '@shared/models/accuracy-analysis/accuracy-report';

import { TestUtils } from './test-utils';
import { ModelFile } from './model-file';

export class AccuracyReportPage {
  testUtils: TestUtils;
  until;
  public elements = {
    createAccuracyRibbon: TestUtils.getElementByDataTestId('CREATE_ACCURACY_REPORT-ribbon'),
    provideAccuracyConfig: TestUtils.getElementByDataTestId('provide-accuracy-configuration'),
    accuracyOnValidation: TestUtils.getElementByDataTestId(`${AccuracyReportType.DATASET_ANNOTATIONS}-report`),
    compareAccuracies: TestUtils.getElementByDataTestId(`${AccuracyReportType.PARENT_MODEL_PREDICTIONS}-report`),
    tensorLevelComparison: TestUtils.getElementByDataTestId(`${AccuracyReportType.PARENT_MODEL_PER_TENSOR}-report`),
    createAccuracyReportButton: TestUtils.getElementByDataTestId('create-accuracy-report'),
    createNewReportButton: TestUtils.getElementByDataTestId('create-new-report'),
    showOnlyErrorImagesCheckbox: TestUtils.getElementByDataTestId('show-only-error-images'),
    networkOutputContainer: TestUtils.getElementByDataTestId('network-output-container'),
    outputName: TestUtils.getElementByDataTestId('output-name'),
    mseValue: TestUtils.getElementByDataTestId('mse-value'),
    accuracyValueContainer: TestUtils.getElementByDataTestId('accuracy-detail'),
    reportModeSwitch: TestUtils.getElementByDataTestId('switch-between-target-platform'),
  };

  public readonly testLayerName = 'ArgMax/Squeeze';

  constructor(originTestUtils?) {
    this.until = protractor.ExpectedConditions;
    this.testUtils = originTestUtils || new TestUtils();
  }

  async isAccuracyAvailable(): Promise<boolean> {
    const classes = await this.elements.createAccuracyReportButton.getAttribute('class');

    return classes.indexOf('disabled') === -1;
  }

  // Should be used on the Create Accuracy Report tab
  async isReportAvailable(type: AccuracyReportType): Promise<boolean> {
    const reportButtonEl: ElementFinder = await this.getReportButton(type);
    const classes: string = await reportButtonEl.getAttribute('class');

    return !classes.includes('disabled');
  }

  async getReportButton(type: AccuracyReportType): Promise<ElementFinder> {
    await browser.wait(
      this.until.presenceOf(await TestUtils.getElementByDataTestId(`${type}-button`)),
      browser.params.defaultTimeout
    );
    return TestUtils.getElementByDataTestId(`${type}-button`);
  }

  async goToAccuracyReportCreationTab(): Promise<void> {
    await this.testUtils.clickElement(this.testUtils.inferenceCard.performTab);
    await browser.sleep(1000);

    // Select accuracy report ribbon
    await this.testUtils.clickElement(this.elements.createAccuracyRibbon);
    await browser.sleep(1000);
  }

  // Should be used on the dashboard
  async runAccuracyEvaluationAndRetrieveValue(
    model: ModelFile | { name: string; framework?: string },
    isOmzModel?: boolean
  ): Promise<string> {
    await this.createAccuracyReport(AccuracyReportType.DATASET_ANNOTATIONS, model, isOmzModel);

    return await this.waitAccuracyTaskAndGetAccuracyValue();
  }

  async waitAccuracyTaskAndGetAccuracyValue(shouldFail?: boolean): Promise<string> {
    let accuracyValue = '';

    await browser
      .wait(async () => {
        if (shouldFail) {
          return true;
        }
        const result = await this.testUtils.inferenceCard.isProjectReady();
        return result === 'done';
      }, browser.params.defaultTimeout)
      .catch((error) => {
        console.log(error);
      });

    await browser.wait(async () => {
      const accuracyValueContainer: ElementFinder = await TestUtils.getNestedElementByDataTestId(
        this.testUtils.inferenceCard.projectInfoContainer,
        'accuracy-value'
      );
      await browser.wait(this.until.presenceOf(accuracyValueContainer), browser.params.defaultTimeout);
      const reg = /\d+(.\d+)?/;

      let text;
      do {
        try {
          text = await accuracyValueContainer.getText();
          if (shouldFail) {
            accuracyValue = text;
            return accuracyValue;
          }
          break;
        } catch (e) {}
      } while (true);

      const matched = text.match(reg);

      if (matched) {
        accuracyValue = matched[0];
      }

      return accuracyValue;
    }, browser.params.defaultTimeout * 10);

    browser.sleep(2000);

    return accuracyValue;
  }

  async getAccuracyValueFromReport(): Promise<string> {
    const accuracyValueElement: ElementFinder = await TestUtils.getNestedElementByDataTestId(
      this.elements.accuracyValueContainer,
      'value'
    );
    return accuracyValueElement.getText();
  }

  // Should be used on dashboard
  async createAccuracyReport(
    type: AccuracyReportType,
    model?: ModelFile | { name: string; framework?: string },
    isOmzModel?: boolean,
    switchAccuracyConfig?: boolean
  ): Promise<boolean> {
    await this.goToAccuracyReportCreationTab();

    if (switchAccuracyConfig) {
      if (!isOmzModel) {
        await this.elements.provideAccuracyConfig.click();
        await browser.sleep(3000);
        await browser.wait(this.until.elementToBeClickable(this.testUtils.modelManagerPage.saveAccuracyButton));
        await this.testUtils.modelManagerPage.saveAccuracyButton.click();
      }
      await this.elements.provideAccuracyConfig.click();
      await browser.sleep(3000);
      await browser.wait(this.until.elementToBeClickable(this.testUtils.configurationWizard.switchPlatformBtn));
      await this.testUtils.configurationWizard.switchPlatformBtn.click();
      await browser.waitForAngularEnabled(false);
      await browser.wait(this.until.elementToBeClickable(this.testUtils.modelManagerPage.saveAccuracyButton));
      await this.testUtils.modelManagerPage.saveAccuracyButton.click();
      await browser.waitForAngularEnabled(true);
    }

    // Click radio for the needed report
    await this.testUtils.clickElement(TestUtils.getElementByDataTestId(`${type}-button`));

    // fill accuracy settings if accuracy evaluation is needed
    if (type === AccuracyReportType.DATASET_ANNOTATIONS) {
      const isAccuracyAvailable: boolean = await this.isAccuracyAvailable();
      if (!isAccuracyAvailable && isOmzModel) {
        throw new Error(
          'Accuracy settings should be prefilled for the OMZ models and accuracy button should be available.'
        );
      }

      if ('accuracyData' in model && model.accuracyData && !isAccuracyAvailable) {
        await this.testUtils.clickElement(this.elements.provideAccuracyConfig);
        await this.testUtils.modelManagerPage.configureAccuracySettingsAndSave(
          model.accuracyData.adapter.taskType,
          model.accuracyData
        );
      }
      await browser.sleep(1500);
    }

    // Start accuracy
    await browser.wait(
      this.until.visibilityOf(this.elements.createAccuracyReportButton),
      browser.params.defaultTimeout
    );
    await this.testUtils.clickElement(this.elements.createAccuracyReportButton);
    await browser.sleep(5000);

    // Wait for project complete status
    console.log('Wait accuracy report');
    return await this.testUtils.waitForProjectToBeReady();
  }

  // Should be used on the opened table
  async getColumnData(
    type: DetectionReportEntityKey | ClassificationReportEntityKey | TensorDistanceReportEntityKey
  ): Promise<string[]> {
    const dataElements: ElementFinder[] = await TestUtils.getAllElementsByDataTestId(`${type}-data`);

    const data: string[] = [];
    for (const el of dataElements) {
      data.push(await el.getText());
    }

    return data;
  }

  async visualizeFirstImageInTheTable(): Promise<void> {
    const tableEl: ElementFinder = TestUtils.getElementByDataTestId('data-table');
    const visualizeBtn: ElementFinder = TestUtils.getNestedElementByDataTestId(tableEl, 'action-button');
    await browser.wait(this.until.visibilityOf(visualizeBtn), browser.params.defaultTimeout);
    await new TestUtils().clickElement(visualizeBtn);
    await browser.sleep(1000);
    await browser.wait(this.until.visibilityOf(this.elements.networkOutputContainer), browser.params.defaultTimeout);
  }
}
