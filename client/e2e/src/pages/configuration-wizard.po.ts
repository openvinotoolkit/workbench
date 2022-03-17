import { browser, by, element, ElementArrayFinder, ElementFinder, protractor } from 'protractor';

import { DatasetTypeNames } from '@store/dataset-store/dataset.model';
import { ModelTaskTypeNames } from '@store/model-store/model.model';

import { TestUtils } from './test-utils';
import { Helpers } from './helpers';

const path = require('path');

export enum InferenceType {
  CPU,
  GPU,
  VPU,
}

export enum OptimizationType {
  INT_8,
}

export enum ConfigurationWizardPageTables {
  MODELS = 'models',
  DATASETS = 'datasets',
}

enum EditButtonDataTestId {
  MODELS = 'edit-model-convert-button',
  DATASETS = 'edit-import-dataset-button',
}

export enum TranformationOptions {
  HORIZONTAL = 'applyHorizontalFlip',
  VERTICAL = 'applyVerticalFlip',
  ERASE = 'applyErase',
  NOISE = 'applyNoise',
  COLOR = 'applyImageCorrections',
}

export class NotAnnotatedDataSet {
  name: string;
  imageFiles: Array<{ pathToImage: string }>;

  constructor(name: string, imageFiles: Array<{ pathToImage: string }>) {
    this.name = name;
    this.imageFiles = imageFiles;
  }
}

export class ConfigurationWizardPage {
  helper = new Helpers();
  until = protractor.ExpectedConditions;

  get runInferenceButton(): ElementFinder {
    return TestUtils.getElementByDataTestId('go-btn');
  }

  get addRemoteMachine(): ElementFinder {
    return TestUtils.getElementByDataTestId('add-machine');
  }

  get modelsTable(): ElementFinder {
    return element(by.css('[data-test-id=models-table]'));
  }

  get importDatasetFileButton(): ElementFinder {
    return TestUtils.getElementByDataTestId('import-dataset-file');
  }

  get importNLPDatasetFileButton(): ElementFinder {
    return TestUtils.getElementByDataTestId('import-text-dataset');
  }

  get uploadDatasetTab(): ElementFinder {
    return TestUtils.getElementByDataTestId('upload-dataset-tab');
  }

  get createNADatasetTab(): ElementFinder {
    return TestUtils.getElementByDataTestId('create-dataset-tab');
  }

  get importModelFileButton(): ElementFinder {
    return element(by.id('import-model-file'));
  }

  get importFilePage(): ElementFinder {
    return element(by.id('import-file-page'));
  }

  get browseInput(): ElementFinder {
    return element(by.id('selectedFile'));
  }

  get textDatasetFileInput(): ElementFinder {
    return TestUtils.getElementByDataTestId('upload-text-dataset');
  }

  get encodingField(): ElementFinder {
    return TestUtils.getElementByDataTestId('encoding-form-field');
  }

  get separatorField(): ElementFinder {
    return TestUtils.getElementByDataTestId('separator-form-field');
  }

  get taskTypeField(): ElementFinder {
    return TestUtils.getElementByDataTestId('tasktype-form-field');
  }

  get textColumnControl(): ElementFinder {
    return TestUtils.getElementByDataTestId('text-form-field');
  }

  get premiseColumnControl(): ElementFinder {
    return TestUtils.getElementByDataTestId('premise-form-field');
  }

  get hypothesisColumnControl(): ElementFinder {
    return TestUtils.getElementByDataTestId('hypothesis-form-field');
  }

  get labelColumnControl(): ElementFinder {
    return TestUtils.getElementByDataTestId('label-form-field');
  }

  get rawDatasetPreviewTable(): ElementFinder {
    return TestUtils.getElementByDataTestId('raw-dataset-preview-table');
  }

  get formattedDatasetPreviewTable(): ElementFinder {
    return TestUtils.getElementByDataTestId('formatted-dataset-preview-table');
  }

  async getAllRawDatasetPreviewRows(): Promise<ElementArrayFinder> {
    return TestUtils.getAllNestedElementsByDataTestId(this.rawDatasetPreviewTable, 'raw-dataset-preview-row');
  }

  async getAllFormattedDatasetPreviewRows(): Promise<ElementArrayFinder> {
    return TestUtils.getAllNestedElementsByDataTestId(this.formattedDatasetPreviewTable, 'formatted-dataset-row');
  }

  get uploadButton(): ElementFinder {
    return TestUtils.getElementByDataTestId('import-button');
  }

  get datasetNameInput(): ElementFinder {
    return element(by.id('datasetNameControl'));
  }

  get textDatasetNameForm(): ElementFinder {
    return TestUtils.getElementByDataTestId('datasetname-form-field');
  }

  async textDatasetNameInput(): Promise<ElementFinder> {
    const form: ElementFinder = this.textDatasetNameForm;
    return form.element(by.id('datasetName'));
  }

  get modelTypeSelector(): ElementFinder {
    return element(by.id('taskType'));
  }

  get selectTargetDevice(): ElementFinder {
    return element(by.name('device'));
  }

  get progressBarUploading(): ElementFinder {
    return element(by.id('upload-progress-bar'));
  }

  get deleteButton(): ElementFinder {
    return TestUtils.getElementByDataTestId('delete-file');
  }

  get cancelButton(): ElementFinder {
    return element(by.id('cancel-file'));
  }

  get fileType(): ElementFinder {
    return element(by.id('file-type'));
  }

  get numberOfRuns(): ElementFinder {
    return element(by.name('numberOfRuns'));
  }

  get modelSubType(): ElementFinder {
    return element(by.id('taskMethod'));
  }

  get modelTag(): ElementFinder {
    return element(by.id('yoloType'));
  }

  get metricType(): ElementFinder {
    return element(by.id('type'));
  }

  get integralType(): ElementFinder {
    return element(by.id('integral'));
  }

  get hasBackground(): ElementFinder {
    return element(by.xpath('//*[@id="hasBackground"]'));
  }

  get modelDownloadButton(): ElementFinder {
    return element(by.id('download-model'));
  }

  get selectedModelName(): ElementFinder {
    return element(by.id('selected-model-name'));
  }

  get progressBarStatus(): ElementFinder {
    return TestUtils.getElementByDataTestId('status-bar-progress');
  }

  get editAccuracyButton(): ElementFinder {
    return element(by.id('edit-accuracy-btn'));
  }

  get setInferenceTime(): ElementFinder {
    return TestUtils.getElementByDataTestId('set-inference-time');
  }

  get switchPlatformBtn(): ElementFinder {
    return TestUtils.getElementByDataTestId('switch-between-target-platform');
  }

  get uploadImageFile(): ElementFinder {
    return TestUtils.getElementByDataTestId('image-input');
  }

  get editImportDatasetButton(): ElementFinder {
    return TestUtils.getElementByDataTestId('edit-import-dataset-button');
  }

  get tryAgainButton(): ElementFinder {
    return TestUtils.getElementByDataTestId('try-again-button');
  }

  get errorMessageBox(): ElementFinder {
    return TestUtils.getElementByDataTestId('message-box-error');
  }

  get notifications(): ElementArrayFinder {
    return TestUtils.getAllElementsByDataTestId('notification');
  }

  get selectModelStageLink(): ElementFinder {
    return TestUtils.getElementByDataTestId('select-model-stage');
  }

  get selectEnvironmentsStageLink(): ElementFinder {
    return TestUtils.getElementByDataTestId('select-environment-stage');
  }

  get selectDatasetStageLink(): ElementFinder {
    return TestUtils.getElementByDataTestId('select-dataset-stage');
  }

  get targetRibbon(): ElementFinder {
    return TestUtils.getElementByDataTestId('target-ribbon');
  }

  get platformRibbon(): ElementFinder {
    return TestUtils.getElementByDataTestId('platform-ribbon');
  }

  getModelActionsTrigger(row: ElementFinder): ElementFinder {
    return TestUtils.getNestedElementByDataTestId(row, 'model-actions-trigger');
  }

  getCloseButtonByNotification(notification: ElementFinder): ElementFinder {
    return TestUtils.getNestedElementByDataTestId(notification, 'close-button');
  }

  async selectTargetRibbon(): Promise<void> {
    console.log('Wait for target ribbon');
    await browser.wait(this.until.elementToBeClickable(this.targetRibbon), browser.params.defaultTimeout);
    console.log('Select target ribbon');
    await this.targetRibbon.click();
  }

  async selectPlatformRibbon(): Promise<void> {
    console.log('Wait for platform ribbon');
    await browser.wait(this.until.elementToBeClickable(this.platformRibbon), browser.params.defaultTimeout);
    console.log('Select platform ribbon');
    await this.platformRibbon.click();
  }

  async selectModelStage(): Promise<void> {
    console.log('Wait model stage link');
    await browser.wait(this.until.elementToBeClickable(this.selectModelStageLink), browser.params.defaultTimeout);
    console.log('Select model stage');
    await this.selectModelStageLink.click();
  }

  async selectEnvironmentStage(): Promise<void> {
    console.log('Wait environment stage link');
    await browser.wait(
      this.until.elementToBeClickable(this.selectEnvironmentsStageLink),
      browser.params.defaultTimeout
    );
    console.log('Select environment stage');
    await this.selectEnvironmentsStageLink.click();
    await browser.sleep(700);
  }

  async selectDatasetStage(): Promise<void> {
    console.log('Wait dataset stage link');
    await browser.wait(this.until.elementToBeClickable(this.selectDatasetStageLink), browser.params.defaultTimeout);
    console.log('Select dataset stage');
    await this.selectDatasetStageLink.click();
  }

  async openModelActionsMenu(row): Promise<void> {
    console.log('Wait for model row');
    await browser.wait(this.until.elementToBeClickable(row), browser.params.defaultTimeout);
    console.log('Click on actions trigger');
    await new TestUtils().clickElement(await this.getModelActionsTrigger(row));
  }

  async getDeleteModelButtonFromMenu(): Promise<ElementFinder> {
    const menu: ElementFinder = await element(by.css('.model-actions-menu-test-id'));
    return TestUtils.getNestedElementByDataTestId(menu, 'delete-model-file');
  }

  get naDatasetSpinner(): ElementFinder {
    return TestUtils.getElementByDataTestId('images-loading');
  }

  async getOpenModelButtonFromMenu(): Promise<ElementFinder> {
    const menu: ElementFinder = await element(by.css('.model-actions-menu-test-id'));
    return TestUtils.getNestedElementByDataTestId(menu, 'visualize-model');
  }

  getMessageTitle(messageBox: ElementFinder): ElementFinder {
    return TestUtils.getNestedElementByDataTestId(messageBox, 'message-title');
  }

  getMessageDetails(messageBox: ElementFinder): ElementFinder {
    return TestUtils.getNestedElementByDataTestId(messageBox, 'message-details');
  }

  getImageCard(imagePath): ElementFinder {
    return TestUtils.getElementByDataTestId(path.basename(imagePath));
  }

  getImageCardDeleteButton(el: ElementFinder) {
    return el.element(by.css('[svgIcon="close_circle"]'));
  }

  get moreDetailsButton(): ElementFinder {
    return TestUtils.getElementByDataTestId('details-button');
  }

  async basePlatformSelect(): Promise<ElementFinder> {
    const container = await TestUtils.getElementByDataTestId('base-platform-select');
    return container.element(by.className('mat-select'));
  }

  async getUploadingListRow(name: string): Promise<ElementFinder> {
    const row = TestUtils.getElementByDataTestId(`row_name_${name}`);
    await browser.wait(this.until.presenceOf(row), browser.params.defaultTimeout);

    return row;
  }

  async uploadsModelsTableElementsCount(): Promise<number> {
    return element.all(by.css('[data-test-id="models-table"] tbody tr')).count();
  }

  async uploadsDatasetTableElementsCount(): Promise<number> {
    return element.all(by.css('[data-test-id="datasets-table"] tbody tr')).count();
  }

  async createNADatasetImageCount(): Promise<number> {
    await browser.wait(this.until.stalenessOf(this.naDatasetSpinner), browser.params.defaultTimeout);
    const hintEl = TestUtils.getElementByDataTestId('images-size-hint');
    const images = await hintEl.getAttribute('data-test-images');
    return +images;
  }

  async openDownloadModelsTable(): Promise<void> {
    this.modelDownloadButton.click();
    console.log('Opened OMZ tab');
  }

  async openImportDatasetFilePage(domain: string = 'CV'): Promise<void> {
    await this.selectDatasetStage();
    const openButton: ElementFinder = domain === 'NLP' ? this.importNLPDatasetFileButton : this.importDatasetFileButton;
    await browser.wait(this.until.elementToBeClickable(openButton), browser.params.defaultTimeout);
    await openButton.click();
  }

  async selectImportDatasetTab(): Promise<void> {
    await browser.wait(this.until.elementToBeClickable(this.uploadDatasetTab), browser.params.defaultTimeout);
    await this.uploadDatasetTab.click();
  }

  async openImportModelFilePage(): Promise<void> {
    await this.importModelFileButton.click();
  }

  async selectDatasetFile(fileToUpload, resource_dir): Promise<void> {
    await this.makeFileInputVisible(this.browseInput);
    await browser.wait(this.until.visibilityOf(this.browseInput), browser.params.defaultTimeout);
    const fileAbsolutePath = path.resolve(__dirname, resource_dir, fileToUpload.path);
    await this.browseInput.sendKeys(fileAbsolutePath);
    // Clear default file name pre-populated from file system
    await this.datasetNameInput.clear();
    await this.datasetNameInput.sendKeys(fileToUpload.name);
    await browser.sleep(1000);
  }

  async uploadDatasetImage(imageFile, resourceDir): Promise<void> {
    await this.makeFileInputVisible(this.uploadImageFile);
    await browser.wait(this.until.visibilityOf(this.uploadImageFile), browser.params.defaultTimeout);
    const testImageFileAbsolutePath = path.resolve(__dirname, resourceDir, imageFile.pathToImage);
    await this.uploadImageFile.sendKeys(testImageFileAbsolutePath);
    await browser.sleep(1000);
  }

  async setAdapter(adapter): Promise<void> {
    await this.selectValueFromDropdown(this.modelTypeSelector, adapter.taskType);

    if (adapter.subType) {
      await this.selectValueFromDropdown(this.modelSubType, adapter.subType);
    }

    if (adapter.tag) {
      await this.selectValueFromDropdown(this.modelTag, adapter.tag);
    }
  }

  async setMetric(metric): Promise<void> {
    if (!metric) {
      return;
    }

    await this.selectValueFromDropdown(this.metricType, metric.name);

    if (metric.integral) {
      await this.selectValueFromDropdown(this.integralType, metric.integral);
    }
  }

  async setPreProcessing(preProcessing): Promise<void> {
    if (!preProcessing) {
      return;
    }

    if (preProcessing.hasBackground) {
      await this.selectValueFromDropdown(this.hasBackground, preProcessing.hasBackground);
    }
  }

  async setPostProcessing(postProcessing) {
    if (!postProcessing) {
      return;
    }
  }

  async selectValueFromDropdown(el: ElementFinder, value: string): Promise<void> {
    await browser.wait(this.until.elementToBeClickable(el), 5000);
    await el.click();
    const optionElement = element(by.cssContainingText('.mat-option-text', `__REGEXP__/^${value}$/`));
    await browser.wait(this.until.presenceOf(optionElement), 5000);
    await optionElement.click();
    await browser.sleep(1500);
  }

  async makeFileInputVisible(inputElement: ElementFinder): Promise<void> {
    await browser.executeScript('arguments[0].style.display = "block"', inputElement.getWebElement());
  }

  async waitForProgressBar(): Promise<void> {
    // smooth inference progress implemented with rxjs delay function
    // which completely blocks protractor execution
    // in order to solve it "await browser.waitForAngularEnabled(false);" used here
    // docs: https://www.protractortest.org/#/timeouts
    await browser.waitForAngularEnabled(false);
    await browser.wait(this.until.presenceOf(this.progressBarStatus), browser.params.defaultTimeout * 2);
    await browser.waitForAngularEnabled(true);
  }

  async isModelUploadingRunning(name: string): Promise<void> {
    await this.waitForModelsRows();
    await this.waitForProgressBar();
    const startTime = new Date().getTime();
    return new Promise(async (resolve, reject) => {
      do {
        const currentTime = new Date().getTime();
        try {
          const row = element(by.css(`[data-test-id="models-table"] [data-test-id='row_name_${name}']`));
          const progressBarValue = await TestUtils.getAllNestedElementsByDataTestId(row, 'current-percent')
            .first()
            .getText();
          if (+progressBarValue > 0) {
            console.log('Model uploading is running.');
            console.log('Current uploading percent:', progressBarValue);
          } else {
            console.log(progressBarValue);
            console.log('received error for checking uploading status. try one more time.');
          }
          resolve();
          return;
        } catch (e) {
          if (currentTime - startTime > browser.params.defaultTimeout * 2) {
            reject(e);
          }
        }
      } while (true);
    });
  }

  async isNotificationAvailable(): Promise<boolean> {
    const lastNotification = await this.notifications.last();
    await browser.wait(this.until.presenceOf(lastNotification), browser.params.defaultTimeout);
    return lastNotification.isPresent();
  }

  async closeAllNotifications(): Promise<void> {
    const notificationCount = await this.notifications.count();
    for (let index = 0; index < notificationCount; index++) {
      const notification = await this.notifications.get(index);
      const closeButton = await this.getCloseButtonByNotification(notification);
      await browser.wait(this.until.elementToBeClickable(closeButton), browser.params.defaultTimeout);
      await closeButton.click();
    }
  }

  async checkErrorMessageBox(parent?: ElementFinder): Promise<boolean> {
    const errorMessageBox = parent
      ? await TestUtils.getNestedElementByDataTestId(parent, 'message-box-error')
      : this.errorMessageBox;
    await browser.wait(this.until.presenceOf(errorMessageBox), browser.params.defaultTimeout);
    const isMessageBoxPresent = await errorMessageBox.isPresent();
    const messageTitle = await this.getMessageTitle(errorMessageBox).getText();
    await browser.sleep(500);
    await this.clickDetailsButton();
    await browser.sleep(500);
    const messageDetails = await this.getMessageDetails(errorMessageBox).getText();
    await this.clickDetailsButton();
    console.log('checked error message box ');
    return !!(isMessageBoxPresent && messageTitle && messageDetails);
  }

  async checkTryAgainFunctional(validUrl: string): Promise<boolean> {
    await this.clickTryAgainButton(this.tryAgainButton);
    await browser.sleep(500);
    const isValidUrl = await browser.getCurrentUrl().then((url: string) => url.includes(validUrl));
    const isMessageBoxPresent = await this.errorMessageBox.isPresent();
    return isValidUrl && isMessageBoxPresent;
  }

  async waitForEditButton(name: string, table: ConfigurationWizardPageTables): Promise<void> {
    const buttonDataTestId =
      table === ConfigurationWizardPageTables.MODELS ? EditButtonDataTestId.MODELS : EditButtonDataTestId.DATASETS;
    const parentRow = element(by.css(`[data-test-id="${table}-table"] [data-test-id='row_name_${name}']`));
    await browser.wait(
      this.until.presenceOf(TestUtils.getNestedElementByDataTestId(parentRow, buttonDataTestId)),
      browser.params.defaultTimeout * 10
    );
  }

  async clickDetailsButton(): Promise<void> {
    console.log('try click Show Details');
    await browser.wait(this.until.elementToBeClickable(this.moreDetailsButton), browser.params.defaultTimeout);
    await this.moreDetailsButton.click();
    console.log('clicked Show Details');
  }

  async clickTryAgainButton(buttonElement: ElementFinder): Promise<void> {
    console.log('try click Try Again');
    await browser.wait(this.until.elementToBeClickable(buttonElement), browser.params.defaultTimeout);
    await buttonElement.click();
    console.log('clicked Try Again');
  }

  async showModelInfo(): Promise<void> {
    const detailsOpener = await TestUtils.getElementByDataTestId('model-details');
    await browser.wait(this.until.elementToBeClickable(detailsOpener), browser.params.defaultTimeout);
    await detailsOpener.click();
    await browser.wait(this.until.presenceOf(await TestUtils.getElementByDataTestId('model-details-section')));
    await browser.sleep(2000);
  }

  async getConfigParameters(group: ElementFinder): Promise<ElementArrayFinder> {
    await browser.sleep(500);
    return await group.all(by.className('parameter'));
  }

  async getConfigParameterData(parameter: ElementFinder): Promise<{ name: string; value: string }> {
    const nameElement: ElementFinder = await parameter.element(by.className('name'));
    await browser.wait(this.until.presenceOf(nameElement), browser.params.defaultTimeout);
    const name = await nameElement.getText();

    const valueElement: ElementFinder = await parameter.element(by.className('value'));

    if (await valueElement.isPresent()) {
      await browser.wait(this.until.presenceOf(valueElement), browser.params.defaultTimeout);
      const value = await valueElement.getText();

      return { name, value };
    }
    const linksWrapper: ElementFinder = await parameter.element(by.className('links-value'));

    if (await linksWrapper.isPresent()) {
      await browser.wait(this.until.presenceOf(linksWrapper), browser.params.defaultTimeout);

      const links: ElementFinder[] = await linksWrapper.all(by.className('link'));

      const linksValues: string[] = [];
      for (const link of links) {
        const linkText = await link.getText();
        linksValues.push(linkText);
      }
      return { name, value: linksValues.toString() };
    }

    // TODO: 74877
    expect(
      (await valueElement.isPresent()) || (await linksWrapper.isPresent()) || String(name).trim() === 'Precision:'
    ).toBeTruthy('Value or links element should be present');
    return { name, value: 'n/a' };
  }

  async validateTheoreticalAnalysis(): Promise<void> {
    const data = await TestUtils.getElementByDataTestId('theoretical-analysis');
    const configParameters = await this.getConfigParameters(data);

    if (!(await configParameters.length)) {
      throw new Error('Theoretical analysis row is empty.');
    }

    for (const parameter of configParameters) {
      const parameterValue = (await this.getConfigParameterData(parameter)).value;
      await expect(parseFloat(parameterValue)).toBeGreaterThanOrEqual(
        0,
        `Parameter is null or undefined: ${parameterValue}`
      );
    }
    console.log('Theoretical Analysis info is validated.');
  }

  async validateConversionSettings(modelFile): Promise<void> {
    const conversionConfig = JSON.stringify(modelFile.conversionSettings).toLowerCase();

    await this.validateParamsPresence(JSON.stringify(modelFile).toLowerCase(), 'conversion-settings');

    if (modelFile.conversionSettings.opSets) {
      await this.validateParamsPresence(conversionConfig, 'opSets');
      console.log('opSets are validated');
    }

    if (modelFile.conversionSettings.inputs) {
      await this.validateParamsPresence(conversionConfig, 'inputs');
      console.log('Inputs are validated');
    }

    if (modelFile.conversionSettings.outputs) {
      await this.validateParamsPresence(conversionConfig, 'outputs');
      console.log('Outputs are validated');
    }

    console.log('Conversion settings are validated');
  }

  async validateAccuracyConfiguration(modelFile): Promise<void> {
    const accuracyConfig = JSON.stringify(modelFile.accuracyData).toLowerCase();

    const isGenericPresent = await this.validateParamsPresence(accuracyConfig, 'accuracy-configuration');
    if (isGenericPresent) {
      return;
    }

    if (modelFile.accuracyData.preProcessing) {
      await this.validateParamsPresence(accuracyConfig, 'accuracy-preprocessing');
    }

    if (modelFile.accuracyData.postProcessing) {
      await this.validateParamsPresence(accuracyConfig, 'accuracy-postprocessing');
    }

    if (modelFile.accuracyData.metric) {
      await this.validateParamsPresence(accuracyConfig, 'accuracy-metric');
    }
  }

  async validateCalibrationProperties(calibrationProperties: object): Promise<void> {
    await browser.sleep(700);

    const data = await TestUtils.getElementByDataTestId('calibration-data');
    const configParameters = await this.getConfigParameters(data);

    if (!(await configParameters.length)) {
      throw new Error(`No config parameters found for calibration`);
    }

    for (const parameter of configParameters) {
      const { value } = await this.getConfigParameterData(parameter);

      const parameterValue = parseFloat(value) ? parseFloat(value) : value;

      expect(Object.values(calibrationProperties).includes(parameterValue));
    }

    await browser.refresh();
    await browser.sleep(1000);
    await new TestUtils().inferenceCard.openDetailsTab();
    await browser.sleep(1000);

    // Validate info in project row
    const calibrationAlgorithmContainer: ElementFinder = await TestUtils.getElementByDataTestId(
      'calibration-method-detail'
    );
    const calibrationAlgorithm: string = await TestUtils.getNestedElementByDataTestId(
      calibrationAlgorithmContainer,
      'value'
    ).getText();
    console.log(calibrationAlgorithm);
    expect(Object.values(calibrationProperties).includes(calibrationAlgorithm)).toBeTruthy();

    const calibrationDatasetContainer: ElementFinder = await TestUtils.getElementByDataTestId(
      'calibration-dataset-detail'
    );
    const calibrationDatasetName: string = await TestUtils.getNestedElementByDataTestId(
      calibrationDatasetContainer,
      'value'
    ).getText();
    expect(Object.values(calibrationProperties).includes(calibrationDatasetName)).toBeTruthy();
  }

  async validateOMZModelDetails(): Promise<void> {
    // TODO: 35703
    // await this.validateTheoreticalAnalysis();

    const paramsToValidate = ['conversion-settings', 'inputs'];

    for (const paramID of paramsToValidate) {
      const data = await TestUtils.getElementByDataTestId(paramID);
      const configParameters = await this.getConfigParameters(data);

      if (!(await configParameters.length)) {
        throw new Error(`${paramID} is empty.`);
      }

      const results = await Promise.all(
        (configParameters as ElementFinder[]).map(async (param) => {
          const parameterValue = await param.element(by.className('value')).getText();
          return parameterValue === 'N/A' ? false : Boolean(parameterValue);
        })
      );

      expect(results.every(Boolean)).toBeTruthy(`Some values for ${paramID} are not present.`);
      await console.log(`${paramID} are validated.`);
    }
  }

  async validateParamsPresence(modelFileConfig: string, params: string): Promise<void | boolean> {
    const data = await TestUtils.getElementByDataTestId(params);
    const configParameters = await this.getConfigParameters(data);

    const regExp = new RegExp('[0-9]+.+[0-9]', 'g');

    if (!(await configParameters.length)) {
      throw new Error(`No config parameters found for ${params}`);
    }
    for (const parameter of configParameters) {
      let parameterValue: string = (await this.getConfigParameterData(parameter)).value.toLowerCase();

      if (parameterValue.match(regExp) && !parameterValue.includes('opset')) {
        parameterValue = parameterValue.match(regExp)[0].replace(/\s+/g, '');
        await expect(modelFileConfig.includes(parameterValue)).toBeTruthy(
          `Param ${parameterValue} is not present in ${modelFileConfig}`
        );
      } else {
        parameterValue = parameterValue.replace(/\s+/g, '').toLowerCase();

        await expect(modelFileConfig.replace(/\s+/g, '').includes(parameterValue)).toBeTruthy(
          `Param ${parameterValue} is not present in ${modelFileConfig}`
        );
      }
    }
  }

  async isUploadReady(name: string): Promise<boolean> {
    const parentRow = element(by.css(`[data-test-id='row_name_${name}']`));
    const complete = await parentRow.element(by.className('status-bar-icon-ready')).isPresent();
    const errorLoad = await parentRow.element(by.className('status-bar-icon-error')).isPresent();
    const canEditError = await TestUtils.getNestedElementByDataTestId(parentRow, 'edit-model-convert-btn').isPresent();
    const canTryAgainError = await TestUtils.getNestedElementByDataTestId(
      parentRow,
      'edit-import-dataset-button'
    ).isPresent();
    if (complete) {
      return true;
    }
    if (errorLoad && !canEditError && !canTryAgainError) {
      await browser.sleep(5000);
      await this.checkingErrorInModelDownloader();
    } else {
      if (errorLoad && canEditError) {
        throw new Error('Fail, but can edit');
      }
      if (errorLoad && canTryAgainError) {
        throw new Error('Fail, but can try again');
      }
    }
  }

  async isUploadCancelled(name: string): Promise<boolean> {
    const parentRow = element(by.css(`[data-test-id="row_name_${name}"]`));
    await browser.wait(
      this.until.presenceOf(parentRow.element(by.className('status-bar-icon-cancelled'))),
      browser.params.defaultTimeout * 10
    );
    return true;
  }

  async isUploadHasErrors(): Promise<boolean> {
    const errorContainer = await TestUtils.getElementByDataTestId(`message-box-error`);
    console.log('Wait error');
    await browser.wait(this.until.presenceOf(errorContainer), browser.params.defaultTimeout);
    return true;
  }

  async isRowSelected(name: string): Promise<boolean> {
    const parentRow = element(by.css(`[data-test-id="row_name_${name}"]`));
    const classes = await parentRow.getAttribute('class');

    return classes.split(' ').indexOf('selected') !== -1;
  }

  async deleteUploadedFile(name: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      await this.selectDatasetStage();
      console.log(`removing artifact: ${name}`);
      const parentRow = await this.getUploadingListRow(name);

      console.log(`revealed delete button (artifact: ${name})`);
      const deleteButton = await TestUtils.getAllNestedElementsByDataTestId(parentRow, 'delete-file').first();
      await browser.sleep(1000);

      console.log(`waiting for artifact to disappear (artifact: ${name})`);
      await browser.wait(
        this.until.elementToBeClickable(deleteButton),
        browser.params.defaultTimeout,
        'Delete button should be clickable'
      );
      if (browser.currentBrowserName === 'firefox') {
        await deleteButton.click();
      } else {
        await new TestUtils().clickElement(deleteButton);
      }
      await browser
        .wait(this.until.not(this.until.visibilityOf(parentRow)), browser.params.defaultTimeout)
        .catch(() => {
          reject();
          return;
        });
      console.log(`artifact disappeared (artifact: ${name})`);
      resolve();
    });
  }

  async deleteUploadedModel(name: string): Promise<void> {
    console.log(`removing model: ${name}`);
    const parentRow = await this.getUploadingListRow(name);

    await this.openModelActionsMenu(parentRow);

    console.log(`revealed delete button (model: ${name})`);
    const deleteButton = await this.getDeleteModelButtonFromMenu();

    console.log(`waiting for model to disappear (model: ${name})`);
    await browser.wait(
      this.until.elementToBeClickable(deleteButton),
      browser.params.defaultTimeout,
      'Delete button should be clickable'
    );
    await browser.sleep(2500);
    if (browser.currentBrowserName === 'firefox') {
      await deleteButton.click();
    } else {
      await new TestUtils().clickElement(deleteButton);
    }
    await browser.wait(this.until.not(this.until.visibilityOf(parentRow)), browser.params.defaultTimeout);
    console.log(`model disappeared (artifact: ${name})`);
  }

  async openModel(name: string): Promise<void> {
    console.log(`Opening model ${name}`);
    const parentRow = await this.getUploadingListRow(name);
    await this.openModelActionsMenu(parentRow);

    const openButton = await this.getOpenModelButtonFromMenu();
    await browser.wait(
      this.until.elementToBeClickable(openButton),
      browser.params.defaultTimeout,
      'Open button should be clickable'
    );
    await browser.sleep(2500);
    await new TestUtils().clickElement(openButton);
  }

  async cancelUploading(name: string): Promise<void> {
    console.log('entered cancel');

    return new Promise(async (resolve, reject) => {
      do {
        try {
          const row: ElementFinder = TestUtils.getElementByDataTestId(`row_name_${name}`);
          const cancel: ElementFinder = TestUtils.getNestedElementByDataTestId(row, 'cancel-process');
          await new TestUtils().clickElement(cancel);
          console.log('clicked cancel');
          resolve();
          return;
        } catch (e) {
          console.log(`received error for cancelling import row. try one more time.`);
        }
      } while (true);
    });
  }

  async waitForModelsRows(): Promise<number> {
    console.log('waiting for model rows');
    await browser.wait(async () => {
      return (await this.uploadsModelsTableElementsCount()) > 0;
    }, browser.params.defaultTimeout);
    return await this.uploadsModelsTableElementsCount();
  }

  async waitForDatasetsRows(): Promise<number> {
    await browser.wait(async () => {
      return (await this.uploadsDatasetTableElementsCount()) > 0;
    }, browser.params.defaultTimeout);
    return await this.uploadsDatasetTableElementsCount();
  }

  async selectModelForInference(modelName, precision?) {
    await this.selectModelStage();
    await this.waitForModelsRows();
    return new Promise(async (resolve, reject) => {
      do {
        try {
          const row = element(by.css(`[data-test-id="models-table"] [data-test-id='row_name_${modelName}']`));
          await new TestUtils().clickElement(row);
          console.log('model selected');
          resolve(row);
          return;
        } catch (e) {
          console.log(`received error for selecting import row. try one more time.`);
        }
      } while (true);
    });
  }

  async uploadDataset(datasetFile, resourceDir): Promise<void> {
    await this.openImportDatasetFilePage();
    await this.selectImportDatasetTab();
    // Verify external link pop-up
    await this.expandDatasetTips();
    await new TestUtils().checkExternalLinkDialogWindow();

    await this.selectDatasetFile(datasetFile, resourceDir);

    if (datasetFile['format'] === DatasetTypeNames.CITYSCAPES) {
      const selectTypes = await TestUtils.getElementByDataTestId('datasettype-form-field');
      await this.selectValueFromDropdown(selectTypes, DatasetTypeNames.CITYSCAPES);
    }

    await this.uploadButton.click();

    await this.selectDatasetStage();

    // TODO refactor and uncomment, task: 21191
    // await this.isUploadingRunning(datasetFile.name).catch((err) => {
    //   fail();
    // });
    await browser.wait(() => this.isUploadReady(datasetFile.name), browser.params.defaultTimeout * 10);

    await this.validateDatasetInfo(datasetFile);

    await this.selectDatasetRow(datasetFile);
  }

  async expandDatasetTips(): Promise<void> {
    const datasetTypes = ['imagenet', 'voc', 'coco'];
    for (const datasetType of datasetTypes) {
      const info = await TestUtils.getElementByDataTestId(`${datasetType}-dataset-tip`);
      await browser.sleep(1000);
      await TestUtils.scrollToElement(info);
      await browser.sleep(1000);
      await info.click();
    }
  }

  async runInference(targetDevice, isPerformanceComparison?: boolean): Promise<void> {
    await this.selectEnvironmentStage();
    await browser.sleep(5000);

    const selectDevice = TestUtils.getElementByDataTestId('device-select');
    await browser.wait(this.until.elementToBeClickable(selectDevice), browser.params.defaultTimeout);
    await selectDevice.click();

    await browser.sleep(5000);

    const deviceName = TestUtils.targetNameFromEnumForWizard(targetDevice).toUpperCase();
    const option = TestUtils.getElementByDataTestId(`device_${deviceName}`);
    await browser.wait(this.until.elementToBeClickable(option), browser.params.defaultTimeout);
    await option.click();

    if (!isPerformanceComparison) {
      await this.setInferenceTime.click();
    }

    await browser.sleep(500);
    await browser.wait(this.until.elementToBeClickable(this.runInferenceButton), browser.params.defaultTimeout);
    await this.runInferenceButton.click();
  }

  async importDatasetFile(
    datasetFile,
    resource_dir,
    validDataset = true,
    datasetConvertType?: DatasetTypeNames
  ): Promise<void> {
    browser.sleep(1000);
    const uploadedElementsCount = await this.uploadsDatasetTableElementsCount();
    await this.openImportDatasetFilePage();
    await this.selectImportDatasetTab();
    expect(await this.importFilePage.isPresent()).toBeTruthy();
    expect(await this.uploadButton.isEnabled()).toBeFalsy();
    await this.selectDatasetFile(datasetFile, resource_dir);
    expect(await this.uploadButton.isEnabled()).toBeTruthy();
    if (datasetConvertType) {
      const selectTypes = await TestUtils.getElementByDataTestId('datasettype-form-field');
      await this.selectValueFromDropdown(selectTypes, datasetConvertType);
    }
    await this.uploadButton.click();
    if (validDataset) {
      await browser.wait(() => this.isUploadReady(datasetFile.name), browser.params.defaultTimeout * 6);
      expect(await this.uploadsDatasetTableElementsCount()).toEqual(uploadedElementsCount + 1);
      await this.validateDatasetInfo(datasetFile);
      await this.deleteUploadedFile(datasetFile.name);
    }
  }

  async setColumnsData(datasetFile): Promise<void> {
    switch (datasetFile.accuracyData.task) {
      case ModelTaskTypeNames.TEXT_CLASSIFICATION:
        await this.selectValueFromDropdown(this.textColumnControl, datasetFile.columnsData.textColumn);
        await this.selectValueFromDropdown(this.labelColumnControl, datasetFile.columnsData.labelColumn);
        break;
      case ModelTaskTypeNames.TEXTUAL_ENTAILMENT:
        await this.selectValueFromDropdown(this.premiseColumnControl, datasetFile.columnsData.premiseColumn);
        await this.selectValueFromDropdown(this.hypothesisColumnControl, datasetFile.columnsData.hypothesisColumn);
        await this.selectValueFromDropdown(this.labelColumnControl, datasetFile.columnsData.labelColumn);
        break;
    }
  }

  async validateDatasetPreview(datasetFile): Promise<void> {
    expect(await this.rawDatasetPreviewTable.isPresent()).toBeTruthy();
    expect(await this.formattedDatasetPreviewTable.isPresent()).toBeTruthy();

    const rawRows: ElementFinder[] = await this.getAllRawDatasetPreviewRows();
    const formattedRows: ElementFinder[] = await this.getAllFormattedDatasetPreviewRows();

    for (const [idx, testLabel] of datasetFile.previewTestData.labels.entries()) {
      const currentRawRowText: string = await rawRows[idx].getText();

      switch (datasetFile.accuracyData.task) {
        case ModelTaskTypeNames.TEXT_CLASSIFICATION:
          expect(currentRawRowText).toContain(testLabel);
          expect(currentRawRowText).toContain(datasetFile.previewTestData.texts[idx]);

          // Skip the first row for the formatted preview as it is the column names
          if (idx === 0 && datasetFile.hasHeader) {
            continue;
          }

          const currentFormattedRowTextClassification: string = await formattedRows[idx - 1].getText();

          expect(currentFormattedRowTextClassification).toContain(testLabel);
          expect(currentFormattedRowTextClassification).toContain(datasetFile.previewTestData.texts[idx]);
          break;
        case ModelTaskTypeNames.TEXTUAL_ENTAILMENT:
          expect(currentRawRowText).toContain(testLabel);
          expect(currentRawRowText).toContain(datasetFile.previewTestData.premises[idx]);
          expect(currentRawRowText).toContain(datasetFile.previewTestData.hypotheses[idx]);

          // Skip the first row for the formatted preview as it is the column names
          if (idx === 0 && datasetFile.hasHeader) {
            continue;
          }

          const currentFormattedRowTextEntailment: string = await formattedRows[idx - 1].getText();

          expect(currentFormattedRowTextEntailment).toContain(testLabel);
          expect(currentFormattedRowTextEntailment).toContain(datasetFile.previewTestData.premises[idx]);
          expect(currentFormattedRowTextEntailment).toContain(datasetFile.previewTestData.hypotheses[idx]);
          break;
      }
    }
  }

  async importNLPDataset(datasetFile, resource_dir): Promise<void> {
    browser.sleep(1000);
    await this.openImportDatasetFilePage(datasetFile.domain);
    expect(await this.uploadButton.isEnabled()).toBeFalsy();

    // Upload dataset file
    await this.makeFileInputVisible(this.textDatasetFileInput);
    await browser.wait(this.until.visibilityOf(this.textDatasetFileInput), browser.params.defaultTimeout);
    const fileAbsolutePath = path.resolve(__dirname, resource_dir, datasetFile.path);
    await this.textDatasetFileInput.sendKeys(fileAbsolutePath);

    // Clear default file name pre-populated from file system
    await (await this.textDatasetNameInput()).clear();
    await (await this.textDatasetNameInput()).sendKeys(datasetFile.name);

    // Set Encoding
    await this.selectValueFromDropdown(this.encodingField, datasetFile.encoding);
    console.log(`Set encoding: ${datasetFile.encoding}.`);
    await browser.sleep(1000);
    // Set separator
    await this.selectValueFromDropdown(this.separatorField, datasetFile.separator);
    console.log(`Set separator: ${datasetFile.separator}.`);

    // Set task type
    await this.selectValueFromDropdown(this.taskTypeField, datasetFile.accuracyData.task);
    console.log(`Set task type: ${datasetFile.accuracyData.task}.`);

    // Set columns based on the task
    await this.setColumnsData(datasetFile);
    console.log('Set columns.');

    // Validate preview
    await this.validateDatasetPreview(datasetFile);
    console.log('Dataset preview is present and validated.');

    await browser.sleep(1000);
    expect(await this.uploadButton.isEnabled()).toBeTruthy();
    await this.uploadButton.click();
    await browser.wait(() => this.isUploadReady(datasetFile.name), browser.params.defaultTimeout * 6);
  }

  async tryAgainImportDatasetFile(
    validDatasetFile,
    brokenDatasetFileName,
    resource_dir,
    elementsCount: number
  ): Promise<boolean> {
    await this.waitForEditButton(brokenDatasetFileName, ConfigurationWizardPageTables.DATASETS);
    await this.clickTryAgainButton(this.editImportDatasetButton);
    const errorMessageIsValid = await this.checkErrorMessageBox();
    await this.selectDatasetFile(validDatasetFile, resource_dir);
    await this.uploadButton.click();
    await browser.wait(() => this.isUploadReady(validDatasetFile.name), browser.params.defaultTimeout * 6);
    const uploadedElementsCount = await this.uploadsDatasetTableElementsCount();
    return elementsCount + 1 === uploadedElementsCount && errorMessageIsValid;
  }

  async uploadImagesForNADataset(datasetName: string, images): Promise<void> {
    await this.datasetNameInput.clear();
    await this.datasetNameInput.sendKeys(datasetName);
    for (const image of images) {
      await this.uploadDatasetImage(image, browser.params.precommit_scope.resource_dir);
    }
  }

  async uploadFolderForNADataset(datasetName: string): Promise<void> {
    await this.datasetNameInput.clear();
    await this.datasetNameInput.sendKeys(datasetName);
    const input = TestUtils.getElementByDataTestId('image-input-folder');
    await this.makeFileInputVisible(input);
    await browser.wait(this.until.visibilityOf(input), browser.params.defaultTimeout);
    const folderPath = path.join(browser.params.precommit_scope.resource_dir, 'images', 'transformation');
    await input.sendKeys(folderPath);
    await browser.sleep(1000);

    await this.importDataset(datasetName);
  }

  async validateDatasetInfo(datasetFile): Promise<void> {
    const parentRow = await TestUtils.getElementByDataTestId(`row_name_${datasetFile.name}`);

    const datasetType = await TestUtils.getNestedElementByDataTestId(parentRow, 'dataset-type').getText();

    expect(
      this.checkDataSetTypes(
        datasetType.toLowerCase().split(', '),
        datasetFile.accuracyData.type.toLowerCase().split(', ')
      )
    ).toBeTruthy();

    if (datasetFile.accuracyData.task) {
      const datasetTask = await TestUtils.getNestedElementByDataTestId(parentRow, 'dataset-task').getText();
      expect(
        this.checkDataSetTypes(
          datasetTask.toLowerCase().split(', '),
          datasetFile.accuracyData.task.toLowerCase().split(', ')
        )
      ).toBeTruthy();
    }
  }

  async checkDataSetTypes(rowTypes: string[], fileTypes: string[]): Promise<boolean> {
    let allIncludes = true;
    fileTypes.forEach((item: string) => {
      if (!rowTypes.includes(item)) {
        allIncludes = false;
      }
    });

    return allIncludes && rowTypes.length === fileTypes.length;
  }

  async checkModelType(modelName: string): Promise<ElementFinder> {
    await this.waitForModelsRows();
    return new Promise(async (resolve, reject) => {
      do {
        try {
          const row = element(by.css(`[data-test-id="models-table"] [data-test-id='row_name_${modelName}']`));
          await browser.sleep(500);
          const fileType = await row.all(by.id('file-type')).first().getText();
          expect(fileType.length).toBeTruthy();
          console.log('Type of the model is:', fileType);
          resolve(row);
          return;
        } catch (e) {
          console.log(`received error for collecting model type. try one more time.`);
        }
      } while (true);
    });
  }

  async selectDatasetRow(datasetFile, isCalibrationDataset: boolean = false): Promise<void> {
    if (!isCalibrationDataset) {
      await this.selectDatasetStage();
    }
    const datasetRow = element(by.css(`[data-test-id="datasets-table"] [data-test-id='row_name_${datasetFile.name}']`));
    await browser.wait(this.until.presenceOf(datasetRow), browser.params.defaultTimeout);
    // there is a bug in firefox which throws an error 'Element <tr> could not be scrolled into view' on a tr element click
    // https://sqa.stackexchange.com/questions/32697/webdriver-firefox-element-could-not-be-scrolled-into-view
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1448825
    // proposed workaround is to click on a child element like td
    await datasetRow.element(by.css('[data-test-id=dataset-name]')).click();
    console.log(`Select dataset ${datasetFile.name}`);
  }

  async checkingErrorInModelDownloader(): Promise<void> {
    const errorMessage = await new TestUtils().checkErrorStatus();
    if (!errorMessage) {
      throw new Error('Error message was not displayed');
    }
    if (errorMessage.includes('Failed to download') || errorMessage.includes('Model import failed')) {
      throw new Error('Failed to download');
    } else {
      await console.log(errorMessage);
      throw new Error('Unexpected error in configuration wizard');
    }
  }

  async deleteImages(datasetFiles: Array<{ pathToImage }>): Promise<void> {
    const initImagesCount = await this.createNADatasetImageCount();
    for (let index = 0; index < datasetFiles.length; index++) {
      const imageCard = await this.getImageCard(datasetFiles[index].pathToImage);
      const deleteBtn = await this.getImageCardDeleteButton(imageCard);
      await TestUtils.scrollToElement(deleteBtn);
      await deleteBtn.click();
      await browser.sleep(1000);
      const currentImageCout = initImagesCount - index - 1;
      expect(await this.createNADatasetImageCount()).toEqual(currentImageCout);
    }
  }

  async selectAllTransformation(): Promise<void> {
    await this.selectTransformationOption(TranformationOptions.HORIZONTAL);
    await this.selectTransformationOption(TranformationOptions.VERTICAL);
    await this.selectTransformationOption(TranformationOptions.ERASE);
    await this.selectTransformationOption(TranformationOptions.NOISE);
    await this.selectTransformationOption(TranformationOptions.COLOR);
  }

  async selectTransformationOption(option: string): Promise<void> {
    const checkBox = TestUtils.getElementByDataTestId(option);
    await TestUtils.scrollToElement(checkBox);
    await browser.sleep(1000);
    await checkBox.click();
    await browser.sleep(1000);

    if (option === TranformationOptions.COLOR) {
      await this.selectAllColorPresets();
    }
  }

  async selectAllColorPresets(): Promise<void> {
    const presets = await TestUtils.getAllElementsByDataTestId('transform-img');
    for (let index = 0; index < presets.length; index++) {
      const preset = presets[index];
      await TestUtils.scrollToElement(preset);
      await preset.click();
      await browser.sleep(500);
    }
  }

  async checkImagesInDataset(datasetName: string, transformation: string): Promise<boolean> {
    let transformedImagePath;
    switch (transformation) {
      case TranformationOptions.HORIZONTAL:
        transformedImagePath = browser.params.precommit_scope.resources.transformedImages.horizontalFlip.pathToImage;
        break;
      case TranformationOptions.VERTICAL:
        transformedImagePath = browser.params.precommit_scope.resources.transformedImages.verticalFlip.pathToImage;
    }
    console.log('Get hash from transformed image');
    const transformedImageHash = await this.helper.hashSum(
      path.join(browser.params.precommit_scope.resource_dir, transformedImagePath)
    );
    console.log(transformedImageHash);
    console.log('Get hash from dataset images');
    const imagesHas = await this.getImagesHasFromDataset(browser.params.dockerConfigDir, datasetName);

    return imagesHas.includes(transformedImageHash);
  }

  async getImagesFromDataset(
    workbenchFolder: string,
    datasetName: string
  ): Promise<{ dataSetPath: string; images: string[] }> {
    const id = await TestUtils.getAllElementsByDataTestId('dataset-name')
      .filter(async (el: ElementFinder) => {
        return (await el.getText()) === datasetName;
      })
      .getAttribute('data-test-dataset-id');
    const dataSetPath = path.join(workbenchFolder, 'datasets', id.toString());
    return {
      dataSetPath: dataSetPath,
      images: this.helper.getFilesFromFolder(dataSetPath, ['png', 'jpg']),
    };
  }

  async getImagesHasFromDataset(workbenchFolder: string, datasetName: string): Promise<string[]> {
    await browser.sleep(1000);
    const { dataSetPath, images } = await this.getImagesFromDataset(workbenchFolder, datasetName);
    const result = [];
    for (let index = 0; index < images.length; index++) {
      const imagePath = path.join(dataSetPath, images[index]);
      result.push(await this.helper.hashSum(imagePath));
    }
    return result;
  }

  async getImagesCountFromDataset(workbenchFolder: string, datasetName: string) {
    await browser.sleep(1000);
    const { images } = await this.getImagesFromDataset(workbenchFolder, datasetName);
    return images.length;
  }

  async checkErrorMessage(containValue: string | number) {
    const warning = await element.all(by.className('error-message')).filter(async (el: ElementFinder) => {
      const warningText = await el.getText();
      console.log(warningText);
      return warningText.includes(`Actual value (${containValue})`);
    });

    return warning.length;
  }

  async openDatasetPageAndImportImages(dataSet: NotAnnotatedDataSet): Promise<void> {
    await this.openImportDatasetFilePage();
    await this.uploadImagesForNADataset(dataSet.name, dataSet.imageFiles);
  }

  async importDataset(datasetName: string): Promise<void> {
    await this.uploadButton.click();
    await browser.wait(() => this.isUploadReady(datasetName), browser.params.defaultTimeout * 4);
  }

  async isModelRowPresent(modelName: string, datasetName: string): Promise<boolean> {
    const rowTestID = `row_name_${modelName}`;
    const projectRow: ElementFinder = await TestUtils.getElementByDataTestId(rowTestID);
    return projectRow.isPresent();
  }

  async isDatasetRowPresent(name: string): Promise<ElementFinder> {
    return element(by.css(`[data-test-id="datasets-table"] [data-test-id='row_name_${name}']`));
  }
}
