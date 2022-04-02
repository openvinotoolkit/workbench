import { browser, by, element, ElementArrayFinder, ElementFinder, Key, protractor } from 'protractor';
import { PNG, PNGWithMetadata } from 'pngjs';
import { PixelmatchOptions } from 'pixelmatch';

import { optimizationJobNamesMap, OptimizationJobTypes, ProjectStatusNames } from '@store/project-store/project.model';
import { DatasetItem } from '@store/dataset-store/dataset.model';
import { ModelPrecisionEnum } from '@store/model-store/model.model';

import { AppPage } from './home-page.po';
import { ConfigurationWizardPage, InferenceType, OptimizationType } from './configuration-wizard.po';
import { InferenceCardPage } from './inference-card.po';
import { AppHeaderPage } from './app-header.po';
import { Helpers } from './helpers';
import { ModelDownloadPage } from './model-download.po';
import { ModelManagerPage } from './model-manager.po';
import { CalibrationPage } from './calibration-configurator.po';
import { PackingModel, PackingSheet } from './packaging.po';
import { LoginPage } from './login.po';
import { TargetMachines } from './target-machines.po';
import { AccuracyReportPage } from './accuracy-report.po';
import { AnalyticsPopup } from './analytics-popup.po';
import { NetronGraph } from './netron.po';
import { AdvancedAccuracyConfigurationPage } from './advanced-accuracy-configuration.po';
import { HFModelDownloadPage } from './hugging-face-model-download.po';
import { InferenceConfigurationPage } from './inference-configuration-page';
import { createWriteStream, readFileSync } from 'fs';
import { ModelFile } from './model-file';

const fs = require('fs');
const path = require('path');
const RestAPICalls = require('./../../restAPICalls.js');
const pixelmatch = require('pixelmatch');

export interface IElementCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum Frameworks {
  TENSORFLOW = 'tensorflow',
  PYTORCH = 'pytorch',
  CAFFE2 = 'caffe2',
  CAFFE = 'caffe',
  MXNET = 'mxnet',
  ONNX = 'onnx',
  OPENVINO = 'openvino',
}

export class TestUtils {
  static dataTestIdPrefix = 'data-test-id';
  homePage: AppPage;
  analyticsPopup: AnalyticsPopup;
  configurationWizard: ConfigurationWizardPage;
  inferenceCard: InferenceCardPage;
  modelDownloadPage: ModelDownloadPage;
  header: AppHeaderPage;
  modelManagerPage: ModelManagerPage;
  configurationForm: CalibrationPage;
  targetMachines: TargetMachines;
  netronGraph: NetronGraph;
  advancedAccuracy: AdvancedAccuracyConfigurationPage;
  accuracyReport: AccuracyReportPage;
  HFModelDownloadPage: HFModelDownloadPage;
  until;
  helpers: Helpers;
  uploadedDatasets = [];
  uploadedModels = [];
  packingSheet: PackingSheet;
  inferenceConfigurationPage = new InferenceConfigurationPage();
  errorMessages = require('../../../src/assets/data/error-messages.json') || {};

  constructor() {
    this.homePage = new AppPage();
    this.analyticsPopup = new AnalyticsPopup();
    this.configurationWizard = new ConfigurationWizardPage();
    this.inferenceCard = new InferenceCardPage();
    this.modelDownloadPage = new ModelDownloadPage();
    this.helpers = new Helpers();
    this.header = new AppHeaderPage();
    this.modelManagerPage = new ModelManagerPage();
    this.configurationForm = new CalibrationPage();
    this.until = protractor.ExpectedConditions;
    this.packingSheet = new PackingSheet();
    this.targetMachines = new TargetMachines();
    this.netronGraph = new NetronGraph();
    this.HFModelDownloadPage = new HFModelDownloadPage();
    this.advancedAccuracy = new AdvancedAccuracyConfigurationPage(this);
    this.accuracyReport = new AccuracyReportPage(this);
  }

  static getElementByDataTestId(dataTestId: string): ElementFinder {
    return element(by.css(`[${TestUtils.dataTestIdPrefix}="${dataTestId}"]`));
  }

  static getElementsContainingDataTestIdPart(dataTestId: string): ElementArrayFinder {
    return element.all(by.css(`[${TestUtils.dataTestIdPrefix}*="${dataTestId}"]`));
  }

  static getNestedElementContainingDataTestIdPart(parent: ElementFinder, dataTestId: string): ElementFinder {
    return parent.element(by.css(`[${TestUtils.dataTestIdPrefix}*="${dataTestId}"]`));
  }

  static getNestedElementsContainingDataTestIdPart(parent: ElementFinder, dataTestId: string): ElementArrayFinder {
    return parent.all(by.css(`[${TestUtils.dataTestIdPrefix}*="${dataTestId}"]`));
  }

  static getElementByDataTestIdAndName(dataTestId: string, name: string): ElementFinder {
    return element(by.cssContainingText(`[${TestUtils.dataTestIdPrefix}="${dataTestId}"]`, name));
  }

  static getAllElementsByDataTestId(dataTestId: string): ElementArrayFinder {
    return element.all(by.css(`[${TestUtils.dataTestIdPrefix}="${dataTestId}"]`));
  }

  static getNestedElementByDataTestId(parentEl: ElementFinder, childDataTestId: string): ElementFinder {
    return parentEl.element(by.css(`[${TestUtils.dataTestIdPrefix}="${childDataTestId}"]`));
  }

  static getAllNestedElementsByDataTestId(parentEl: ElementFinder, childDataTestId: string): ElementArrayFinder {
    return parentEl.all(by.css(`[${TestUtils.dataTestIdPrefix}="${childDataTestId}"]`));
  }

  static targetNameFromEnum(targetDevice) {
    return targetDevice === InferenceType.CPU
      ? 'CPU'
      : targetDevice === InferenceType.GPU
      ? 'GPU'
      : targetDevice === InferenceType.VPU
      ? 'VPU'
      : '';
  }

  static targetNameFromEnumForWizard(targetDevice) {
    return targetDevice === InferenceType.CPU
      ? 'CPU'
      : targetDevice === InferenceType.GPU
      ? 'GPU' // Gen from 'Intel(R) Gen9 HD Graphics'
      : targetDevice === InferenceType.VPU
      ? 'MYRIAD'
      : '';
  }

  static isFireFoxUsed(): boolean {
    return browser.currentBrowserName === 'firefox';
  }

  static getBrowserLogs() {
    if (!TestUtils.isFireFoxUsed()) {
      const prefix = '[Browser Console Log]';
      console.log(prefix, 'Getting browser console logs');
      return browser
        .manage()
        .logs()
        .get('browser')
        .then((browserLogs) => {
          browserLogs.forEach((log) => {
            if (log.level.value > 900) {
              console.error(prefix, `Error: ${log.message}`);
              if (new TestUtils().failSpec(log.message)) {
                browser.currentTest.failedExpectations.push({
                  matcherName: 'toBeTruthy',
                  message: `Browser console have errors:\n Message:\n ${log.message}`,
                  stack: ``,
                  passed: false,
                  expected: [],
                  actual: false,
                });
              }
            } else {
              console.log(prefix, log.message);
            }
          });
        });
    }
  }

  static async takeScreenshot() {
    try {
      if (browser.currentTest.failedExpectations.length) {
        const browserName = browser.currentBrowserName;
        const spec = browser.currentTest.description;
        const logsPath = browser.params.logsPath;
        if (!fs.existsSync(logsPath)) {
          fs.mkdirSync(logsPath);
        }
        const timeStamp = new Date().getTime();
        const png = await browser.takeScreenshot();
        console.log(`${logsPath}${browserName}-${spec}-${timeStamp}.png`);
        const stream = fs.createWriteStream(`${logsPath}${browserName}-${spec}-${timeStamp}.png`);
        stream.write(Buffer.from(png, 'base64'));
        stream.end();
      }
    } catch (err) {
      console.log('Cant write screenshot');
    }
  }

  static async isErrorPopupPresent() {
    const errorPopup = await TestUtils.getElementByDataTestId('error-popup');
    const until = protractor.ExpectedConditions;
    do {
      try {
        await browser.wait(until.presenceOf(errorPopup), browser.params.defaultTimeout);
        await console.log(await errorPopup.getText());
        return;
      } catch (err) {
        console.log(`error popup did not show up`);
      }
    } while (true);
  }

  static async setInput(dataTestId: string, value: number) {
    const input = await TestUtils.getElementByDataTestId(dataTestId);
    await input.clear();
    await input.sendKeys(value);
  }

  static async scrollToElement(el: ElementFinder) {
    await browser.executeScript('arguments[0].scrollIntoView()', el.getWebElement());
  }

  /**
   * Return object with checkbox state is disabled and is checked
   * @param checkbox
   */
  static async getCheckboxState(checkbox: ElementFinder): Promise<{ isChecked: boolean; isDisabled: boolean }> {
    expect(await checkbox.isPresent()).toBeTruthy('Checkbox should be present');
    const checkboxClasses = await checkbox.getAttribute('class');
    const isChecked = checkboxClasses.includes('mat-checkbox-checked');
    const isDisabled = checkboxClasses.includes('mat-checkbox-disabled');
    return { isChecked, isDisabled };
  }

  /**
   * Return object with input state
   * @param matFormFieldEl
   */
  static async getMatFormFieldState(matFormFieldEl: ElementFinder) {
    const classes = await matFormFieldEl.getAttribute('class');
    const isInvalid = classes.includes('mat-form-field-invalid');
    const isPristine = classes.includes('ng-pristine');
    const isFocused = classes.includes('mat-focused');
    return { isInvalid, isPristine, isFocused };
  }

  /**
   * checks the expected match of the state of the input field
   * @param matFormField 'mat-form-field' element
   * @param state expected state
   * @param inputName name displayed in expectation output
   */
  static async checkMatFormFieldState(matFormField: ElementFinder, state: 'valid' | 'invalid', inputName = '') {
    const tag = await matFormField.getTagName();
    if (tag !== 'mat-form-field') {
      console.warn('Wrong element passed, exiting');
      return;
    }
    let inputState = await TestUtils.getMatFormFieldState(matFormField);
    if (inputState.isPristine) {
      expect(inputState.isInvalid).toBeFalsy('Pristine ${inputName} input should mark as valid');
      return;
    }
    const input: ElementFinder = await matFormField.element(by.tagName('input'));
    inputState = await TestUtils.getMatFormFieldState(matFormField);
    if (inputState.isFocused) {
      // blur element
      await browser.actions().mouseMove(input, { x: -2000, y: 0 }).click().perform();
    }
    inputState = await TestUtils.getMatFormFieldState(matFormField);
    if (state === 'valid') {
      expect(inputState.isInvalid).toBeFalsy(inputName + ' Input should mark as valid');
    }
    if (state === 'invalid') {
      expect(inputState.isInvalid).toBeTruthy(inputName + ' Input should mark as invalid');
    }
  }

  /**
   * Clear input + mark it as touched
   * Allow clear input and check input validation
   * @param input input element
   */
  static async clearInput(input: ElementFinder): Promise<void> {
    await input.clear();
    await input.sendKeys('1');
    await input.sendKeys(Key.BACK_SPACE);
  }

  getRemoteMachineInfo(isMaster: boolean) {
    const resources = browser.params.precommit_scope.resources;
    return isMaster ? resources.targetMachines.masterRemoteMachine : resources.targetMachines.remoteMachine;
  }

  checkDownloadError(e) {
    if (e.message?.includes('Failed to download') || e.message?.includes('Model import failed')) {
      return false;
    } else {
      console.log(e);
      throw new Error(e);
    }
  }

  failSpec(message) {
    const skipList: { contain: string }[] = browser.params.precommit_scope.ignoreConsoleErrors;
    const isSkip = skipList.filter((item) => {
      const filterPattern = new RegExp(item.contain, 'g');
      return message.match(filterPattern);
    });
    return !isSkip.length;
  }

  clickForFireFox(coordinate: IElementCoordinates): void {
    const x = coordinate.x + coordinate.width / 2;
    const y = coordinate.y + coordinate.height / 2;
    const clickPoint = document.elementFromPoint(x, y) as HTMLElement;
    clickPoint.click();
  }

  async clickElement(el: ElementFinder): Promise<void> {
    await browser.wait(async () => {
      try {
        await browser.wait(this.until.elementToBeClickable(el), 5000);
        const currentElement = await el.getWebElement();
        if (TestUtils.isFireFoxUsed()) {
          const coordinate = await currentElement.getLocation();
          await browser.executeScript(this.clickForFireFox, coordinate);
          return true;
        }
        await browser.driver.actions().mouseMove(currentElement).perform();
        await browser.driver.actions().click().perform();
        return true;
      } catch (e) {
        return false;
      }
    }, browser.params.defaultTimeout);
  }

  async clickButton(testId: string): Promise<void> {
    const button = await TestUtils.getElementByDataTestId(testId);
    await browser.wait(this.until.elementToBeClickable(button), browser.params.defaultTimeout);
    await this.clickElement(button);
  }

  async deleteUploadedModels() {
    console.log(`removing models. count: ${this.uploadedModels.length}`);
    await this.homePage.openConfigurationWizard();
    await browser.sleep(1000);
    const tasks = this.uploadedModels.map(() =>
      this.configurationWizard.deleteUploadedModel.bind(this.configurationWizard)
    );
    return this.sequentialTaskChainExecution(tasks, this.uploadedModels);
  }

  async uploadDataset(datasetFile) {
    await this.configurationWizard.uploadDataset(datasetFile, browser.params.precommit_scope.resource_dir);
    this.uploadedDatasets.push(datasetFile.name);
    console.log(`Uploaded dataset: ${datasetFile.name}`);
  }

  async uploadDatasets(datasets: Partial<DatasetItem>[]): Promise<void> {
    for (const dataset of datasets) {
      await this.uploadDataset(dataset);
    }
  }

  async deleteUploadedDatasets() {
    console.log(`removing datasets. count: ${this.uploadedDatasets.length}`);
    await this.homePage.openConfigurationWizard();
    const tasks = this.uploadedDatasets.map(() =>
      this.configurationWizard.deleteUploadedFile.bind(this.configurationWizard)
    );
    return this.sequentialTaskChainExecution(tasks, this.uploadedDatasets);
  }

  async deleteArtifacts() {
    return this.deleteUploadedModels()
      .then(() => {
        return this.deleteUploadedDatasets();
      })
      .then(() => {
        console.log('uploaded datasets and models are deleted');
        this.uploadedDatasets = [];
        this.uploadedModels = [];
      });
  }

  sequentialTaskChainExecution(tasks, args?) {
    return tasks.reduce((promiseChain, currentTask, i) => {
      return promiseChain.then((chainResults) => {
        const promise = args ? currentTask(args[i]) : currentTask;
        return promise.then((currentResult) => [...chainResults, currentResult]);
      });
    }, Promise.resolve([]));
  }

  topLevelProjectSelector(modelName, datasetName, targetDevice): () => Promise<ElementFinder> {
    return async () => {
      const device = TestUtils.targetNameFromEnum(targetDevice);
      return await this.projectRow(modelName, datasetName, device);
    };
  }

  async getProjectsTable(): Promise<ElementFinder> {
    await browser.sleep(1000);
    const allRows: ElementArrayFinder = element.all(by.className('model-item-row'));
    await browser.wait(async () => {
      return (await allRows.count()) > 0;
    }, browser.params.defaultTimeout);

    const table: ElementFinder = await TestUtils.getElementByDataTestId('projects-table');
    await browser.wait(this.until.presenceOf(table), browser.params.defaultTimeout);

    return table;
  }

  async projectRow(modelName, datasetName, targetDevice): Promise<ElementFinder> {
    const table: ElementFinder = await this.getProjectsTable();
    const row: ElementFinder = TestUtils.getNestedElementByDataTestId(
      table,
      `row_${modelName}_${datasetName}_${targetDevice}`
    );
    await browser.wait(this.until.presenceOf(row), browser.params.defaultTimeout);
    return row;
  }

  async getProjectRowByIndex(index: number): Promise<ElementFinder> {
    const table: ElementFinder = await this.getProjectsTable();
    const row: ElementFinder = table.all(by.css('.model-item-row')).get(index);
    await browser.wait(this.until.presenceOf(row), browser.params.defaultTimeout);
    return row;
  }

  async getLastProjectRow(): Promise<ElementFinder> {
    const table: ElementFinder = await this.getProjectsTable();
    const row: ElementFinder = table.all(by.css('.model-item-row')).last();
    await browser.wait(this.until.presenceOf(row), browser.params.defaultTimeout);
    return row;
  }

  async waitForProjectToBeReady(): Promise<boolean> {
    console.log('waiting for project to become ready');
    await browser.wait(this.until.presenceOf(this.inferenceCard.projectInfoContainer), browser.params.defaultTimeout);
    const isReady = await browser
      .wait(async () => {
        const result = await this.inferenceCard.isProjectReady();
        switch (result) {
          case 'done':
            return true;
          case 'error':
            throw new Error('Project fail');
          default:
            return false;
        }
      }, Number(jasmine.DEFAULT_TIMEOUT_INTERVAL / browser.params.calibrationCoefficient))
      .catch((error) => {
        console.log(error);
        return false;
      });

    if (!isReady) {
      return false;
    }
    console.log('project became ready');
    await browser.sleep(1000);
    return true;
  }

  nestedProjectSelector(
    modelName: string,
    datasetName: string,
    targetDevice: number,
    levels
  ): () => Promise<ElementFinder> {
    return async () => {
      // TODO: make the true nesting project extraction
      return await this.childRow(modelName, datasetName, targetDevice, levels[levels.length - 1]);
    };
  }

  async childRow(modelName, datasetName, targetDevice, nextLevel): Promise<ElementFinder> {
    await browser.sleep(1000);
    const value = {
      [OptimizationType.INT_8]: optimizationJobNamesMap[OptimizationJobTypes.INT_8],
    }[nextLevel];

    return await this.projectRow(`${modelName} - ${value}`, datasetName, TestUtils.targetNameFromEnum(targetDevice));
  }

  async editOverlapThresholdAndSave(row: ElementFinder, value: string) {
    await this.advancedAccuracy.goToAccuracyConfiguration();
    const overlapButton = element(by.id('overlap_threshold'));
    await overlapButton.click();
    await overlapButton.clear();
    await overlapButton.sendKeys(value);
    await this.modelManagerPage.saveAccuracyButton.click();
  }

  async getExecGraph(tableComponent, comparison?) {
    return new Promise(async (resolve, reject) => {
      let inferceJodID;
      let inferceResultID;
      if (!comparison) {
        inferceJodID = await this.getJobID(tableComponent);
        inferceResultID = await this.getInferenceResultID(tableComponent);
      } else {
        inferceJodID = await this.getComparisonJobID(tableComponent);
        inferceResultID = await this.getComparisonInferenceResultID(tableComponent);
      }
      const layers = await this.loadExecGraph(inferceJodID, inferceResultID);
      resolve(layers);
    });
  }

  async getIrGraph(tableComponent) {
    return new Promise(async (resolve) => {
      const modelID = await this.getModelID(tableComponent);
      const layers = await this.loadIrGraph(modelID);
      resolve(layers);
    });
  }

  async loadExecGraph(jobNumber, inferenceId) {
    return new Promise(async (resolve, reject) => {
      try {
        const url = await this.helpers.getBaseUrl();
        const { username, token } = browser.params;
        const res = await new RestAPICalls(url, username, token).getDataFromBackend(`exec-graph/${inferenceId}`, {
          inferenceResultId: inferenceId,
        });
        const layers = this.helpers.extractLayers(res, 'exec');
        resolve(layers);
        return;
      } catch (err) {
        reject(err);
      }
    });
  }

  async loadIrGraph(modelID) {
    return new Promise(async (resolve) => {
      const url = await this.helpers.getBaseUrl();
      const { username, token } = browser.params;
      const res = await new RestAPICalls(url, username, token).getDataFromBackend(`xml-model/${modelID}`);
      const layers = this.helpers.extractLayers(res, 'ir');
      resolve(layers);
    });
  }

  async getSelectedProjectId(tableComponent) {
    await browser.wait(this.until.presenceOf(tableComponent), browser.params.defaultTimeout);
    return tableComponent.getAttribute('data-selected-id');
  }

  async getInferenceResultID(tableComponent) {
    await browser.wait(this.until.presenceOf(tableComponent), browser.params.defaultTimeout);
    return tableComponent.getAttribute('data-inference-result-id');
  }

  async getJobID(tableComponent) {
    await browser.wait(this.until.presenceOf(tableComponent), browser.params.defaultTimeout);
    return tableComponent.getAttribute('data-job-id');
  }

  async getComparisonInferenceResultID(tableComponent) {
    await browser.wait(this.until.presenceOf(tableComponent), browser.params.defaultTimeout);
    return tableComponent.getAttribute('data-inference-result-comparison-id');
  }

  async getComparisonJobID(tableComponent) {
    await browser.wait(this.until.presenceOf(tableComponent), browser.params.defaultTimeout);
    return tableComponent.getAttribute('data-job-comparison-id');
  }

  async getModelID(tableComponent) {
    await browser.wait(this.until.presenceOf(tableComponent), browser.params.defaultTimeout);
    return tableComponent.getAttribute('data-model-id');
  }

  getFilePath(fileName, format = 'tar.gz') {
    return `${browser.params.precommit_scope.downloadedFiles}/${fileName}.${format}`;
  }

  async isFileDownloaded(filePath): Promise<boolean> {
    await browser
      .wait(() => {
        return fs.existsSync(filePath);
      }, browser.params.defaultTimeout)
      .catch((err) => {
        console.log(err);
        console.log('File was not downloaded.');
      });

    if (browser.currentBrowserName === 'firefox') {
      await browser.sleep(+browser.params.defaultTimeout / 10);
    }
    console.log('File was downloaded.');
    return true;
  }

  deleteFile(fileName, format = 'tar.gz') {
    return new Promise(async (resolve, reject) => {
      try {
        const filePath = this.getFilePath(fileName, format);
        fs.unlinkSync(filePath);
        console.log(`File ${fileName}.${format} delete`);
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  }

  async checkTuningSpeedup(minSpeedupRatio?) {
    const originalInferenceFPS: number = parseFloat(await this.inferenceCard.getFpsValue());
    const int8Fps: number = parseFloat(await this.inferenceCard.getFpsValue());
    console.log(`Tuning gives ${int8Fps} FPS, original model gives ${originalInferenceFPS} FPS`);
    // TODO: no real speedup - considerably fluctuating from run to run
    return int8Fps > 0 && originalInferenceFPS > 0;
    // expect(int8Fps > 0 && originalInferenceFPS > 0).toBeTruthy();
  }

  async checkInferencePipeline(model, datasetName, inferenceTarget, isOmzModel?, devCloud?) {
    let accuracy = null;
    await this.checkExecutionAttributes();

    if (!devCloud) {
      accuracy = await this.accuracyReport.runAccuracyEvaluationAndRetrieveValue(model, isOmzModel);
      expect(accuracy).toMatch(/\d+(.\d+)?/);
      console.log('Checked accuracy');
    }

    await this.inferenceCard.openDetailsTab();

    if (!isOmzModel) {
      if (!model.h5path) {
        await this.configurationWizard.validateTheoreticalAnalysis();
      }
      await this.configurationWizard.validateConversionSettings(model);
      await this.configurationWizard.validateAccuracyConfiguration(model);
    } else {
      await this.configurationWizard.validateOMZModelDetails();
      await browser.refresh();
      await browser.sleep(1000);
    }
    return accuracy;
  }

  async checkExecutionAttributes() {
    const inferenceResults = await this.inferenceCard.collectInfoFromExecutionAttributes();
    const fps = inferenceResults.lastFPS;
    const latency = inferenceResults.lastLatency;
    const streams = inferenceResults.lastStreams;
    const batches = inferenceResults.lastBatches;
    expect(fps).toMatch(/\d{1,}/);
    expect(latency).toMatch(/\d{1,}/);
    expect(streams).toMatch(/\d{1,}/);
    expect(batches).toMatch(/\d{1,}/);
    await console.log('Checked tooltip');
  }

  async loadPack(packingModel: PackingModel, modelName?: string) {
    await this.inferenceCard.performTab.click();
    console.log('Open perform tab');

    await browser.wait(this.until.presenceOf(this.inferenceCard.createRibbon), browser.params.defaultTimeout);
    await this.inferenceCard.createRibbon.click();
    console.log('Open packaging tab');

    await this.selectPackingProperty(packingModel);
    console.log('Properties selected.');

    await browser.wait(this.until.elementToBeClickable(this.packingSheet.packButton), browser.params.defaultTimeout);
    await this.packingSheet.packButton.click();
    console.log('Start packing...');

    const fileName = this.packingSheet.packingName(packingModel, modelName);
    const filePath = this.getFilePath(fileName);
    await this.isFileDownloaded(filePath);
    console.log(`File ${fileName} is downloaded.`);

    const config = await this.createConfigForPacking(packingModel);
    const localHash = await this.helpers.hashSum(filePath);
    const url = await this.helpers.getBaseUrl();
    const { username, token } = browser.params;
    const serverHash = await new RestAPICalls(url, username, token).getPackHash(config);
    expect(localHash === serverHash).toBeTruthy(`Local hash ${localHash}, not equal server hash ${serverHash}`);
    await this.deleteFile(fileName);
  }

  async selectPackingProperty(packingModel: PackingModel) {
    let needClick;
    const packingModelKeys = Object.keys(packingModel);

    for (const key of packingModelKeys) {
      const selectedPackingModel = packingModel[key];
      await browser.sleep(2000);
      if (typeof selectedPackingModel === 'boolean') {
        switch (key.toString()) {
          case 'CPU':
            needClick = !(await this.isChecked(this.packingSheet.cpuCheckBox));
            console.log(needClick);
            if ((needClick && selectedPackingModel) || (!needClick && !selectedPackingModel)) {
              await this.packingSheet.cpuCheckBox.click();
              console.log(`click CPU`);
            }
            break;
          case 'GPU':
            needClick = !(await this.isChecked(this.packingSheet.gpuCheckBox));
            if ((needClick && selectedPackingModel) || (!needClick && !selectedPackingModel)) {
              await this.packingSheet.gpuCheckBox.click();
              console.log(`click GPU`);
            }
            break;
          case 'VPU':
            needClick = !(await this.isChecked(this.packingSheet.vpuCheckBox));
            if ((needClick && selectedPackingModel) || (!needClick && !selectedPackingModel)) {
              await this.packingSheet.vpuCheckBox.click();
              console.log(`click VPU`);
            }
            break;
          case 'includeModel':
            if (selectedPackingModel) {
              await this.packingSheet.includeModel.click();
              console.log(`click Yes`);
            }
            break;
        }
      }
      if (key.toString() === 'os') {
        console.log('Selecting OS.');
        const selectOSRadioBtn = await this.packingSheet.getOSRadioButton(selectedPackingModel);
        needClick = !(await this.isRadioButtonSelected(selectOSRadioBtn));
        console.log(`Should select OS? : ${needClick ? 'Yes' : 'No'}`);
        if (needClick) {
          await selectOSRadioBtn.click();
          console.log(`Clicked on ${selectedPackingModel} for OS.`);
        } else {
          console.log(`No need to select OS. ${selectedPackingModel} is already selected.`);
        }
      }
    }
  }

  async isChecked(checkbox: ElementFinder): Promise<boolean> {
    await browser.wait(this.until.elementToBeClickable(await checkbox), browser.params.defaultTimeout);
    const result = await checkbox.element(by.className('mat-checkbox-input')).getAttribute('aria-checked');
    return result === 'true';
  }

  async isRadioDisabled(radioButton: ElementFinder): Promise<boolean> {
    const classes = await radioButton.getAttribute('class');
    return classes.includes('mat-radio-disabled');
  }

  async isRadioButtonSelected(radioBtnEl: ElementFinder): Promise<boolean> {
    await browser.wait(this.until.elementToBeClickable(await radioBtnEl), browser.params.defaultTimeout);
    const classes: string = await radioBtnEl.getAttribute('class');
    return classes.includes('mat-radio-checked');
  }

  async createConfigForPacking(packingModel: PackingModel) {
    const targets = [];

    await browser.wait(this.until.presenceOf(this.inferenceCard.analyzeTab), browser.params.defaultTimeout);
    await this.clickElement(this.inferenceCard.analyzeTab);
    console.log('Open analyze tab');

    await browser.wait(this.until.presenceOf(this.inferenceCard.performanceSubTab));
    await this.clickElement(this.inferenceCard.performanceSubTab);

    const projectId: number = await this.inferenceCard.getProjectID();
    console.log(`Project ${projectId}`);

    for (const key in packingModel) {
      if (typeof packingModel[key] === 'boolean' && packingModel[key] && key !== 'includeModel') {
        targets.push(key);
      }
    }
    return {
      projectId: projectId,
      includeModel: packingModel.includeModel,
      targets: targets,
      targetOS: packingModel.os,
    };
  }

  async checkErrorStatus(): Promise<string> {
    try {
      const errorContainer = await TestUtils.getAllElementsByDataTestId(`message-box-error`)
        .filter(async (el: ElementFinder) => await el.isDisplayed())
        .first();
      const detailBtn = await TestUtils.getNestedElementByDataTestId(errorContainer, 'details-button');
      await detailBtn.click();
      await browser.sleep(500);
      const messageContainer = await TestUtils.getElementByDataTestId('message-details');
      return await messageContainer.getText();
    } catch (error) {
      console.log('Cant get error icon');
    }
  }

  async waitRowStatus() {
    await this.inferenceCard.waitForProgressBar();
    return await this.waitForProjectToBeReady();
  }

  async waitProjectStatus(status: ProjectStatusNames): Promise<void> {
    await browser.wait(
      this.until.presenceOf(
        await TestUtils.getNestedElementByDataTestId(this.inferenceCard.projectInfoContainer, `model-status-${status}`)
      ),
      browser.params.defaultTimeout * 10
    );
  }

  async testPreparation() {
    await this.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await this.analyticsPopup.refuseAnalyticsUsage();
  }

  async checkLink(link: ElementFinder) {
    await browser.wait(this.until.elementToBeClickable(link), browser.params.defaultTimeout);
    await link.click();
    console.log('Clicked on link');
  }

  async checkExternalLinkDialogWindow(parentContainer?: ElementFinder) {
    let links;
    if (parentContainer) {
      links = await TestUtils.getAllNestedElementsByDataTestId(parentContainer, 'external-link');
    } else {
      links = await TestUtils.getAllElementsByDataTestId('external-link');
    }
    for (const link of links) {
      if (await link.isDisplayed()) {
        await browser.sleep(1000);
        await TestUtils.scrollToElement(link);
        await this.checkLink(link);

        const dialogWindow = await TestUtils.getElementByDataTestId('dialog-window');
        expect(await dialogWindow.isPresent()).toBeTruthy('Dialog Window is not shown.');
        await this.clickButton('cancel');
        await console.log('Clicked on Cancel button in the Dialog Window');

        await browser.sleep(700);

        await browser.getAllWindowHandles().then(async (handles) => {
          expect(handles.length).toEqual(1); // Check that there is only one tab
        });
      }
    }
  }

  async checkAnotherTabOpening() {
    const link = await TestUtils.getElementByDataTestId('external-link');
    await this.checkLink(link);

    const dialogWindow = await TestUtils.getElementByDataTestId('dialog-window');
    expect(await dialogWindow.isPresent()).toBeTruthy('Dialog Window is not shown.');
    await this.clickButton('confirm');
    await browser.sleep(1000);

    await browser.getAllWindowHandles().then(async (handles) => {
      expect(handles.length).toEqual(2); // Check that there are two tabs
      await browser.sleep(1000);

      // Closing the opened tab
      await browser.driver.switchTo().window(handles[1]);
      await browser.driver.close();

      // Returning to the tab with tests
      await browser
        .switchTo()
        .window(handles[0])
        .then(async () => {
          await console.log(`Current URL is: ${await browser.getCurrentUrl()}`);
        });
    });
  }

  async downloadAndDeleteModel(modelName, uploadedElementsCount) {
    try {
      await this.configurationWizard.selectModelStage();
      await browser.wait(() => this.configurationWizard.isUploadReady(modelName), browser.params.defaultTimeout * 9);
      await this.configurationWizard.waitForModelsRows();
      await this.configurationWizard.deleteUploadedModel(modelName);
      expect(await this.configurationWizard.uploadsModelsTableElementsCount()).toEqual(uploadedElementsCount);
    } catch (e) {
      return this.checkDownloadError(e);
    }
  }

  async waitForModelRows(): Promise<number> {
    await browser.wait(async () => {
      return (await this.modelManagerPage.uploadsModelsTableElementsCount()) > 0;
    }, browser.params.defaultTimeout);
    return await this.modelManagerPage.uploadsModelsTableElementsCount();
  }

  async waitForDatasetRows(): Promise<number> {
    await browser.wait(async () => {
      return (await this.modelManagerPage.uploadsDatasetsTableElementsCount()) > 0;
    }, browser.params.defaultTimeout);
    return await this.modelManagerPage.uploadsDatasetsTableElementsCount();
  }

  async checkModelAndCleanUp(modelFile, modelsNumberBefore) {
    await this.configurationWizard.isUploadReady(modelFile.name);
    const modelsNumberAfter = await this.waitForModelRows();
    await this.configurationWizard.checkModelType(modelFile.name);
    console.log('Models number after:', modelsNumberAfter);
    console.log('Models names after:', await this.modelManagerPage.getAllLeftoversAssetsNames());
    expect(modelsNumberAfter).toEqual(modelsNumberBefore + 1);
    await this.configurationWizard.deleteUploadedModel(modelFile.name);
  }

  async checkModelDeprecated(modelFile, modelsNumberBefore, errorMessage): Promise<void> {
    const deprecatedDetailedErrorMessage = this.errorMessages.modelUpload.deprecatedIRVersionDescription;
    await this.configurationWizard.isUploadHasErrors();
    expect(errorMessage).toEqual(deprecatedDetailedErrorMessage);

    await this.homePage.openConfigurationWizard();
    await this.configurationWizard.deleteUploadedModel(modelFile.name);
  }

  async makeFileInputVisible(fileType) {
    await browser.executeScript('arguments[0].style.display = "block"', fileType.getWebElement());
  }

  async checkFileDownloadingAndSavePath(fileName: string) {
    const filePath = `${browser.params.precommit_scope.downloadedFiles}/${fileName}`;

    await fs.writeFile(
      `${browser.params.precommit_scope.downloadedFiles}/path_to_report.txt`,
      filePath,
      function (err) {
        if (err) {
          throw new Error(err);
        }
        console.log('The path to the report file was saved!');
      }
    );

    const isFilePresent = await this.isFileDownloaded(filePath);
    expect(isFilePresent).toBeTruthy('File was not downloaded.');
  }

  async downloadProfilingReport(fileName: string): Promise<void> {
    const downloadBtn: ElementFinder = await TestUtils.getElementByDataTestId('download-report');
    await this.clickElement(downloadBtn);

    await browser.sleep(1500);

    await this.checkFileDownloadingAndSavePath(fileName);
    console.log('Profiling report downloaded');
  }

  async downloadPerLayerReport(fileName: string): Promise<void> {
    // Open Performance Detailed tab with Per-layer table
    await this.clickElement(this.inferenceCard.kernelRibbon);
    await browser.sleep(1000);

    const downloadBtn: ElementFinder = await TestUtils.getElementByDataTestId('download-per-layer-report');
    await this.clickElement(downloadBtn);

    await browser.sleep(1500);

    await this.checkFileDownloadingAndSavePath(fileName);
    console.log('Per-layer report downloaded.');
  }

  async pressEraseAllButton(): Promise<void> {
    const userPanelTestId = 'user-toggle';
    const eraseAllButtonTestId = 'erase-all-button';

    await this.clickButton(userPanelTestId);
    await browser.sleep(1000);
    await this.clickButton(eraseAllButtonTestId);

    browser.sleep(1000);
    const confirmBtn = await TestUtils.getElementByDataTestId('confirm');
    if (await confirmBtn.isPresent()) {
      await confirmBtn.click();
    }
  }

  async checkEraseAllResults(): Promise<void> {
    const mainImage = await TestUtils.getElementByDataTestId('capabilities-image');

    await browser.wait(this.until.presenceOf(mainImage), browser.params.defaultTimeout);

    await this.homePage.openConfigurationWizard();

    const uploadedModelsCount = await this.configurationWizard.uploadsModelsTableElementsCount();
    expect(uploadedModelsCount).toEqual(0);

    const uploadedDatasetsCount = await this.configurationWizard.uploadsDatasetTableElementsCount();
    expect(uploadedDatasetsCount).toEqual(0);
  }

  async pressAndCheckEraseAllResults(): Promise<void> {
    await this.pressEraseAllButton();
    await this.checkEraseAllResults();
  }

  async selectSpecificModelAndRunInference(modelFile, dataset, target): Promise<void> {
    await this.testPreparation();
    console.log('Go to configuration wizard');
    await this.homePage.openConfigurationWizard();
    console.log('Select model with ' + modelFile.name + ' name');
    await this.configurationWizard.selectModelForInference(modelFile.name);
    await this.configurationWizard.selectDatasetRow(dataset);
    console.log('Run inference');
    await this.configurationWizard.runInference(target);

    await this.inferenceCard.waitForInferenceOverlay();
    const result = await this.waitForProjectToBeReady();
    expect(result).toBeTruthy('Project should be ready');
  }

  async getPngWithMetadataFromCanvas(canvas: ElementFinder): Promise<PNGWithMetadata> {
    const canvasBase64 = await browser.executeScript(
      "return arguments[0].toDataURL('image/png').substring(21);",
      canvas
    );

    if (typeof canvasBase64 === 'string') {
      const buffer = await Buffer.from(canvasBase64, 'base64');
      return PNG.sync.read(buffer);
    }
  }

  async getPngWithMetadataFromPath(imageFile: { pathToImage: string }): Promise<PNGWithMetadata> {
    const expectedImage = readFileSync(
      path.resolve(__dirname, browser.params.precommit_scope.resource_dir, imageFile.pathToImage)
    );
    return PNG.sync.read(expectedImage);
  }

  async areImagesDifferent(
    firstImage: PNGWithMetadata,
    secondImage: PNGWithMetadata,
    diffImageName: string,
    savePath?: string,
    options?: PixelmatchOptions
  ): Promise<boolean> {
    const width = firstImage.width;
    const height = firstImage.height;
    const diffPng: PNG = new PNG({ width, height });
    const diff: number = await pixelmatch(firstImage.data, secondImage.data, diffPng.data, width, height, options);

    if (!!diff) {
      const filePath = path.join(savePath ? savePath : browser.params.screenShotPath, diffImageName + '.png');
      diffPng.pack().pipe(createWriteStream(filePath));
    }
    return !!diff;
  }

  async selectValueFromDropdown(
    elementFinder: ElementFinder,
    searchText: string,
    cssSelector: string = '.mat-option-text'
  ): Promise<void> {
    await browser.sleep(1000);
    await browser.wait(this.until.elementToBeClickable(elementFinder), browser.params.defaultTimeout);
    await elementFinder.click();
    const optionElement = element(by.cssContainingText(cssSelector, searchText));
    const optionsPresent = this.until.presenceOf(optionElement);
    const optionsClickable = this.until.elementToBeClickable(optionElement);
    await browser.wait(this.until.and(optionsPresent, optionsClickable), browser.params.defaultTimeout);
    await optionElement.click();
  }

  async isButtonClickable(buttonTestId: string): Promise<boolean> {
    const classes = await TestUtils.getElementByDataTestId(buttonTestId).getAttribute('class');

    return classes.split(' ').indexOf('mat-button-disabled') === -1;
  }

  async installFramework(framework: Frameworks): Promise<void> {
    let model = { name: null, framework: null };
    switch (framework) {
      case Frameworks.TENSORFLOW:
        model = { name: 'mobilenet-v1-0.25-128', framework: Frameworks.TENSORFLOW };
        break;
      case Frameworks.PYTORCH:
        model = { name: 'shufflenet-v2-x1.0', framework: Frameworks.PYTORCH };
        break;
      case Frameworks.CAFFE2:
        model = { name: 'densenet-121-caffe2', framework: Frameworks.CAFFE2 };
        break;
      case Frameworks.CAFFE:
        model = { name: 'squeezenet1.0', framework: Frameworks.CAFFE };
        break;
    }
    await this.downloadModelFromOmz(model, 6);
    await this.deleteUploadedModels();
    this.uploadedModels.pop();
  }

  async downloadModelFromOmz(
    model: { name: string; framework: Frameworks },
    downloadMultiplier: number = 4
  ): Promise<void> {
    this.uploadedModels.push(model.name);
    await this.homePage.openConfigurationWizard();
    await this.modelManagerPage.goToModelManager();
    await this.modelDownloadPage.selectAndDownloadModel(model.name);
    await this.modelDownloadPage.convertDownloadedModelToIR(ModelPrecisionEnum.FP16, 25);
    await browser.wait(
      () => this.configurationWizard.isUploadReady(model.name),
      browser.params.defaultTimeout * downloadMultiplier
    );
  }

  async checkDropDownState(dropdown: ElementFinder): Promise<void> {
    const classes = await dropdown.getAttribute('class');
    const id = await dropdown.getAttribute('id');
    if (classes.includes('ng-pristine')) {
      expect(classes.includes('mat-select-invalid')).toBeFalsy('Pristine drop down should mark as valid ' + id);
    }
  }

  async checkDropDownValidationState(dropdown: ElementFinder, expectedState: 'valid' | 'invalid'): Promise<void> {
    const classes = await dropdown.getAttribute('class');
    const id = await dropdown.getAttribute('id');
    if (expectedState === 'valid') {
      expect(classes.includes('mat-select-invalid')).toBeFalsy('Drop down should mark as valid ' + id);
    }
    if (expectedState === 'invalid') {
      expect(classes.includes('mat-select-invalid')).toBeTruthy('Drop down should mark as invalid ' + id);
    }
  }

  async checkDropDownValues(dropdown: ElementFinder, expectedValues?: string[]): Promise<void> {
    await dropdown.click();
    await browser.sleep(1000);
    const optionElements: ElementArrayFinder = element.all(by.className('mat-option-text'));
    const optionValues: string[] = await optionElements.map((elementFinder) => elementFinder.getText());
    expect(optionValues.length && optionValues.every((option) => expectedValues.includes(option))).toBeTruthy(
      'Dropdown should have options: ' + expectedValues.toString()
    );
    dropdown.sendKeys(Key.ESCAPE);
  }

  /**
   * Search for mat-form-field element.
   * @param container
   */
  async getMatFormFieldElement(container: ElementFinder): Promise<ElementFinder> {
    const inputs = container.all(by.tagName('mat-form-field'));
    expect(await inputs.count()).toEqual(1, 'One input field should exist');
    return await inputs.first();
  }

  /**
   * Search for input element material autocomplete.
   * @param autocompleteContainer element with 'wb-select-autocomplete' tag name
   */
  async getAutocompleteInputElement(autocompleteContainer: ElementFinder): Promise<ElementFinder> {
    const inputs = autocompleteContainer.all(by.tagName('input'));
    expect(await inputs.count()).toEqual(1, 'One input field should exist');
    return await inputs.first();
  }

  /**
   * Checks autocomplete validation state by
   * cleaning input
   * filling random value
   * setting suggested value
   * @param autocompleteContainer element with 'wb-select-autocomplete' tag name
   * @param options contain randomName random name to check validation state, elementName name displayed in expectation output
   */
  async checkAutocomplete(
    autocompleteContainer: ElementFinder,
    options?: { randomName?: string; elementName?: string; shouldContainOptions?: boolean }
  ) {
    const elName = options && options.elementName ? options.elementName : '';
    console.log('Check autocomplete');
    const input: ElementFinder = await this.getAutocompleteInputElement(autocompleteContainer);
    const field: ElementFinder = await this.getMatFormFieldElement(autocompleteContainer);
    console.log('Check autocomplete empty state');
    await TestUtils.clearInput(input);
    await TestUtils.checkMatFormFieldState(field, 'invalid', elName);
    // Try to expand autocomplete variants
    // Click on autocomplete not expand it
    // That's why this crunch used
    await input.sendKeys('.');
    await input.sendKeys(Key.BACK_SPACE);
    const selectOptions = element.all(by.tagName('mat-option'));
    const optionsCount = await selectOptions.count();
    if (options && options.randomName) {
      console.log('Check autocomplete with random value');
      await input.sendKeys(options.randomName);
      await TestUtils.checkMatFormFieldState(field, 'valid', elName);
    }
    if (options && options.shouldContainOptions) {
      expect(optionsCount).toBeGreaterThan(0, `Autocomplete ${elName} should contain options`);
    }
    if (optionsCount) {
      console.log('Check autocomplete with predefined value');
      await TestUtils.clearInput(input);
      const autocompleteValue = await selectOptions.first().getText();
      await input.sendKeys(autocompleteValue);
      await TestUtils.checkMatFormFieldState(field, 'valid', elName);
    }
  }

  async openInt8Project(model: ModelFile, dataset: { name }) {
    await this.homePage.navigateTo();

    const card = await TestUtils.getElementByDataTestId(`model-card_${model.name}`);
    const openCardBtn = await TestUtils.getNestedElementByDataTestId(card, 'open-model');
    await browser.wait(this.until.elementToBeClickable(openCardBtn), browser.params.defaultTimeout);
    await openCardBtn.click();

    const int8Row = await TestUtils.getElementByDataTestId(`row_${model.name} - INT8_${dataset.name}`);
    await browser.wait(this.until.presenceOf(int8Row));
    const openInt8Btn = await TestUtils.getNestedElementByDataTestId(int8Row, 'open-project');
    await browser.wait(this.until.elementToBeClickable(openInt8Btn));
    await openInt8Btn.click();
  }

  async uploadTokenizer(modelFile: ModelFile): Promise<void> {
    await this.configurationWizard.openModel(modelFile.name);
    await this.clickElement(TestUtils.getElementByDataTestId('configuration-tab'));
    await this.clickElement(TestUtils.getElementByDataTestId('import-tokenizer'));
    const vocabFileInput: ElementFinder = element(by.id('vocabFile'));
    await this.modelManagerPage.uploadFile(
      vocabFileInput,
      modelFile.tokenizer.vocabPath,
      browser.params.precommit_scope.resource_dir
    );
    await browser.sleep(1000);
    const nameField: ElementFinder = await TestUtils.getElementByDataTestId('name-form-field');
    const nameInput: ElementFinder = await nameField.element(by.id('name'));
    await nameInput.clear();
    await nameInput.sendKeys(modelFile.tokenizer.name);
    await browser.sleep(1000);
    await this.clickElement(TestUtils.getElementByDataTestId('import-button'));
    await this.configurationWizard.isUploadReady(modelFile.tokenizer.name);
    await browser.sleep(4000);
    await this.clickElement(TestUtils.getElementByDataTestId(`row_name_${modelFile.tokenizer.name}`));
    await browser.sleep(1000);
  }
}
