import { browser, by, element, ElementArrayFinder, ElementFinder, protractor } from 'protractor';

import { TestUtils } from './test-utils';
import { ParameterNamePipe } from '../../../src/app/modules/dashboard/components/model-layers-with-graphs/layers-table/parameter-name.pipe';
import { ConfigurationWizardPage } from './configuration-wizard.po';

export class InferenceCardPage {
  until = protractor.ExpectedConditions;
  configurationWizard: ConfigurationWizardPage;
  tooltipMessages = require('../../../src/assets/data/tooltip-messages.json');
  private placeholderRegExp: RegExp;

  constructor() {
    this.configurationWizard = new ConfigurationWizardPage();
    this.placeholderRegExp = /\${\w+}|[${}]/g;
  }

  get toModelPageBreadcrumb() {
    return TestUtils.getElementByDataTestId('to-model-page');
  }

  get inferDataTable() {
    return element(by.id('layers-single-table'));
  }

  get analyzeTab() {
    return TestUtils.getElementByDataTestId('analyze-tab');
  }

  get performTab() {
    return TestUtils.getElementByDataTestId('perform-tab');
  }

  get detailsTab() {
    return TestUtils.getElementByDataTestId('details-tab');
  }

  get performanceSubTab() {
    return TestUtils.getElementByDataTestId('PERFORMANCE-ribbon');
  }

  get precisionRibbon() {
    return TestUtils.getElementByDataTestId('precision-ribbon');
  }

  get metricsRibbon() {
    return TestUtils.getElementByDataTestId('metrics-ribbon');
  }

  get kernelRibbon() {
    return TestUtils.getElementByDataTestId('KERNEL-ribbon');
  }

  get optimizeRibbon() {
    return TestUtils.getElementByDataTestId('optimize-ribbon');
  }

  get tuneRibbon() {
    return TestUtils.getElementByDataTestId('tune-ribbon');
  }

  get createRibbon() {
    return TestUtils.getElementByDataTestId('create-ribbon');
  }

  get expandPerLayerDistributionTable() {
    return TestUtils.getElementByDataTestId('expand-layer-summary-table');
  }

  get precisionDistributionTable() {
    return TestUtils.getElementByDataTestId('precisions-distribution-table');
  }

  async getProjectID(): Promise<number> {
    return parseInt(await TestUtils.getElementByDataTestId('project-id').getText(), 10);
  }

  async progressBarStatus(parentRow) {
    let row, progressBar;
    if (parentRow) {
      row = await parentRow();
      progressBar = TestUtils.getNestedElementByDataTestId(row, 'status-bar-progress');
    } else {
      progressBar = TestUtils.getElementByDataTestId('status-bar-progress');
    }
    return progressBar;
  }

  get calibrate() {
    return TestUtils.getElementByDataTestId('calibrate-to-int8');
  }

  get layersTable() {
    return element(by.id('layers-table'));
  }

  get inferenceHistoryTable(): ElementFinder {
    return TestUtils.getElementByDataTestId('inference-history-table');
  }

  get inferenceHistoryTableBodyRows(): ElementArrayFinder {
    return this.inferenceHistoryTable.all(by.css('tbody tr'));
  }

  taskIsRunningMessage(defaultClasses: string = '.action-block wb-info-hint') {
    const taskIsRunningMessage = this.tooltipMessages.global.taskIsRunning;
    return element(by.cssContainingText(defaultClasses, taskIsRunningMessage));
  }

  get executeParametrsContainer() {
    return element(by.className('executed-layer-parameters'));
  }

  get labelsTabsHeader() {
    return element(by.className('mat-tab-labels'));
  }

  get linkToTheOriginalProject(): ElementFinder {
    return TestUtils.getElementByDataTestId('link-to-original-project');
  }

  get labelsTabs() {
    return element.all(by.css('.layer-details-sidenav-content-tabs .mat-tab-label'));
  }

  get layerDetails() {
    return element(by.className('layer-details-container'));
  }

  get layerNotAvailable() {
    return element(by.cssContainingText('.layer-not-available-container', 'Layer is not available on device'));
  }

  get projectInfoContainer() {
    return TestUtils.getElementByDataTestId('project-info');
  }

  accuracyBtn(parentRow) {
    return parentRow.element(by.css('[data-test-id=accuracy-btn]'));
  }

  get compareBtn(): ElementFinder {
    return TestUtils.getElementByDataTestId('compare-btn');
  }

  getLayerTableRows(table: ElementFinder): ElementArrayFinder {
    return table.all(by.className('mat-row'));
  }

  getOpenRows(table: ElementFinder): ElementArrayFinder {
    return table.all(by.className('details-opened'));
  }

  get getLayersSingleTable() {
    return element(by.css('wb-layers-single-table'));
  }

  get adviceExpanders(): ElementArrayFinder {
    // As there can be many advise containers -> return all
    return TestUtils.getAllElementsByDataTestId('precision-improvement');
  }

  getAdviceSummary(adviceName: string): ElementFinder {
    return TestUtils.getElementByDataTestId(`advising-summary-${adviceName}`);
  }

  getAdviceNextSteps(adviceName: string): ElementFinder {
    return TestUtils.getElementByDataTestId(`advising-next-steps-${adviceName}`);
  }

  getAdviceTheory(adviceName: string): ElementFinder {
    return TestUtils.getElementByDataTestId(`advising-theory-${adviceName}`);
  }

  async selectPerformanceRibbonAndGetLayersTable() {
    await browser.wait(this.until.presenceOf(this.kernelRibbon));
    await new TestUtils().clickElement(this.kernelRibbon);

    await browser.wait(this.until.presenceOf(this.getLayersSingleTable));

    return this.getLayersSingleTable;
  }

  layerTableRowName(row: ElementFinder) {
    return row.element(by.className('layer-name-cell')).getText();
  }

  async openRowName(row) {
    return {
      rowName: await row.element(by.className('layer-name-cell-name-row')).getText(),
      rowType: await row.element(by.className('layer-name-cell-type-row')).getText(),
    };
  }

  getDetailsHeader(nameLayer) {
    return element(by.cssContainingText('.layer-details-sidenav-content-layer-name', nameLayer));
  }

  async getCellRow(row) {
    return row.element(by.className('cdk-column-layer'));
  }

  get singleInferenceRadioButton() {
    // there is an issue clicking exactly on a mat-radio-button, label is to solve it
    return element(by.css('[data-test-id="single-inference-radio-button"] label'));
  }

  get groupInferenceRadioButton() {
    // there is an issue clicking exactly on a mat-radio-button, label is to solve it
    return element(by.css('[data-test-id="group-inference-radio-button"] label'));
  }

  get streamInputField() {
    const streamFormField = TestUtils.getElementByDataTestId('stream-form-field');
    return TestUtils.getNestedElementContainingDataTestIdPart(streamFormField, 'stream');
  }

  get batchInputField() {
    const streamFormField = TestUtils.getElementByDataTestId('batch-form-field');
    return TestUtils.getNestedElementContainingDataTestIdPart(streamFormField, 'batch');
  }

  get executeInferenceButton() {
    return TestUtils.getElementByDataTestId('execute-inference-button');
  }

  get configureInferenceButton() {
    return TestUtils.getElementByDataTestId('configure-inference-button');
  }

  async openDetailsTab() {
    await this.detailsTab.click();
    await browser.wait(this.until.presenceOf(TestUtils.getElementByDataTestId('model-details-section')));
  }

  async runSingleInference(batch: number, streams: number): Promise<void> {
    await new TestUtils().clickElement(this.performTab);

    await browser.wait(this.until.presenceOf(this.tuneRibbon));
    await this.tuneRibbon.click();

    await browser.wait(this.until.presenceOf(this.singleInferenceRadioButton));
    await this.singleInferenceRadioButton.click();

    await browser.wait(this.until.presenceOf(this.streamInputField));
    this.streamInputField.clear();
    this.streamInputField.sendKeys(streams);
    this.batchInputField.clear();
    this.batchInputField.sendKeys(batch);

    await browser.wait(this.until.presenceOf(this.executeInferenceButton));
    await this.executeInferenceButton.click();
  }

  async goToConfigureInferencePage() {
    await new TestUtils().clickElement(this.performTab);

    await browser.wait(this.until.presenceOf(this.tuneRibbon));
    await this.tuneRibbon.click();

    await browser.wait(this.until.presenceOf(this.groupInferenceRadioButton));
    await this.groupInferenceRadioButton.click();

    await browser.wait(this.until.presenceOf(this.configureInferenceButton));
    await this.configureInferenceButton.click();
  }

  getFusedParametrsContainer(irLayerName) {
    return element
      .all(by.className('fused-layer-parameters'))
      .filter(async (el) => {
        const nameRow = await el.element(by.className('fused-layer-parameters-layer-name')).getText();
        return nameRow === irLayerName;
      })
      .first()
      .element(by.className('fused-layer-parameters-row'));
  }

  getParameterValue(container, label): Promise<string> {
    const parameter = container
      .all(by.cssContainingText('.parameter-name', label))
      .first()
      .element(by.xpath('..'))
      .element(by.className('parameter-value'));
    browser.wait(this.until.presenceOf(parameter), browser.params.defaultTimeout);
    return parameter.getText();
  }

  async selectInt8Tab(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      await new TestUtils().clickElement(this.performTab);

      await browser.wait(this.until.presenceOf(this.optimizeRibbon));
      await new TestUtils().clickElement(this.optimizeRibbon);

      await browser
        .wait(() => browser.isElementPresent(this.calibrate), browser.params.defaultTimeout)
        .catch((err) => {
          reject(err);
          return;
        });
      resolve(null);
      return;
    });
  }

  async isProjectReady(): Promise<boolean | string> {
    if (await this.projectInfoContainer.element(by.className('status-bar-icon-ready')).isPresent()) {
      return 'done';
    } else if (await this.projectInfoContainer.element(by.className('status-bar-icon-error')).isPresent()) {
      return 'error';
    }
    return false;
  }

  async getFpsValue(): Promise<string> {
    const fps = await TestUtils.getElementByDataTestId('fps-value');
    return await fps.getText();
  }

  async collectInfoFromExecutionAttributes() {
    await browser.sleep(1000);

    // Select first row in inference history table (batch 1, stream 1)
    const inferenceHistoryTable = this.inferenceHistoryTable;
    const firstInferenceRow = inferenceHistoryTable.all(by.css('tbody tr')).get(0);
    await firstInferenceRow.click();
    await browser.wait(async () => {
      const classes = await firstInferenceRow.getAttribute('class');
      return classes.includes('selected');
    }, browser.params.defaultTimeout);

    const attributesEl = await TestUtils.getElementByDataTestId('execution-attributes');

    const fps = await TestUtils.getNestedElementByDataTestId(attributesEl, 'fps').getText();
    const latency = await TestUtils.getNestedElementByDataTestId(attributesEl, 'latency').getText();
    const nireq = await TestUtils.getNestedElementByDataTestId(attributesEl, 'nireq').getText();
    const batch = await TestUtils.getNestedElementByDataTestId(attributesEl, 'batch').getText();

    return {
      lastFPS: parseFloat(fps),
      lastLatency: parseFloat(latency),
      lastStreams: parseFloat(nireq),
      lastBatches: parseFloat(batch),
    };
  }

  async collectInfoFromInferenceHistory(): Promise<{ batch: number; streams: number; throughput: number }[]> {
    const inferenceResults: { batch: number; streams: number; throughput: number }[] = [];
    const inferenceHistoryRows = await this.inferenceHistoryTableBodyRows;
    const trimNonNumbers = (value: string) => Number(value.trim().replace(/[^\d.]/g, ''));
    for (const row of inferenceHistoryRows) {
      const batchCellText = await TestUtils.getNestedElementByDataTestId(row, 'batch-cell').getText();
      const batch = trimNonNumbers(batchCellText);
      const streamsCellText = await TestUtils.getNestedElementByDataTestId(row, 'nireq-cell').getText();
      const streams = trimNonNumbers(streamsCellText);
      const throughputCellText = await TestUtils.getNestedElementByDataTestId(row, 'throughput-cell').getText();
      const throughput = trimNonNumbers(throughputCellText);
      inferenceResults.push({ batch, streams, throughput });
    }
    return inferenceResults;
  }

  async getProjectsCount(): Promise<number> {
    return await TestUtils.getAllElementsByDataTestId('project-id').count();
  }

  checkUrl(url) {
    const re = new RegExp('dashboard/[0-9]*');
    return re.test(url);
  }

  uploadsTableElementsCount() {
    return element.all(by.className('model-item-row')).count();
  }

  get runningInferenceOverlayEl() {
    return element.all(by.css('[data-test-id="running-inference-overlay"]'));
  }

  async waitForRows() {
    await browser.wait(async () => {
      return (await this.uploadsTableElementsCount()) > 0;
    }, browser.params.defaultTimeout);
    return await this.uploadsTableElementsCount();
  }

  async waitForInferenceOverlay() {
    console.log('wait for inference overlay');
    // smooth inference progress implemented with rxjs delay function
    // which completely blocks protractor execution
    // in order to solve it "await browser.waitForAngularEnabled(false);" used here
    // docs: https://www.protractortest.org/#/timeouts
    await browser.waitForAngularEnabled(false);
    await browser.wait(async () => {
      return await this.runningInferenceOverlayEl.isPresent();
    }, browser.params.defaultTimeout);
    await browser.waitForAngularEnabled(true);
    console.log('inference overlay was shown');
  }

  async waitForProgressBar(row?, processType: string = 'process') {
    return new Promise(async (resolve, reject) => {
      let statusPercent;
      const startTime = new Date().getTime();
      do {
        try {
          const progressBar = await this.progressBarStatus(row);
          console.log('Wait progress bar');
          await browser.wait(this.until.presenceOf(progressBar), browser.params.defaultTimeout);
          const percentElement = await TestUtils.getNestedElementByDataTestId(progressBar, 'current-percent');
          statusPercent = await percentElement.getText();
          const reg = new RegExp(`[0-9]+`);
          const currentPercent = reg.exec(statusPercent)[0];
          console.log(`${processType} is running.`);
          console.log(`Current ${processType} percent:`, currentPercent);
          resolve(Number(currentPercent) > 0);
          return;
        } catch (err) {
          if (new Date().getTime() - startTime > browser.params.defaultTimeout * 3) {
            reject('Progress bar not found');
          }
          console.log(`received error for collecting ${processType} percent. try one more time.`);
        }
      } while (true);
    });
  }

  async layersPresentInInferenceTable(table, expectedLayers): Promise<string[]> {
    await browser.wait(async () => await this.tableIsLoaded(table), browser.params.defaultTimeout);
    return new Promise(async (resolve, reject) => {
      const unExpectedRows = [];
      const names = await this.getLayerTableRows(table).all(by.className('cdk-column-layerName')).getText();
      for (let i = 0; i < expectedLayers.length; i++) {
        if (!names.includes(expectedLayers[i].name)) {
          unExpectedRows.push(expectedLayers[i].name);
        }
      }
      resolve(unExpectedRows);
    });
  }

  async equalPrecisionLayerAndTable(table, layers): Promise<string[]> {
    const errorArray = [];
    const rowsObj = await this.getInferenceTablePrecision(table);
    for (let i = 0; i < layers.length; i++) {
      const name = layers[i].name;
      if (name === 'data' || rowsObj[name] === 'N/A') {
        continue;
      }
      if (rowsObj[name] !== layers[i].data.runtimePrecision) {
        errorArray.push(name);
      }
    }
    return errorArray;
  }

  async getInferenceTablePrecision(table: ElementFinder) {
    return new Promise(async (resolve, reject) => {
      const rows = await this.getLayerTableRows(table);
      const rowsObj = {};
      for (let i = 0; i < rows.length; i++) {
        const row = await rows[i];
        const name = await this.layerTableRowName(row);
        const precisionParameter = await TestUtils.getNestedElementByDataTestId(row, 'runtime_precision_property');
        rowsObj[name] = await TestUtils.getNestedElementByDataTestId(precisionParameter, 'value').getText();
      }
      resolve(rowsObj);
      return;
    });
  }

  async checkValueInLayerTable(table, executionGraph, irGraph, comparisonGraph?): Promise<string[]> {
    await browser.wait(async () => await this.tableIsLoaded(table), browser.params.defaultTimeout);

    return new Promise(async (resolve, reject) => {
      console.log('Start check value');
      const rowsWithError: string[] = [];
      const openRows = await this.getOpenRows(table);
      for (let i = 0; i < openRows.length; i++) {
        const row = openRows[i];
        const { rowName, rowType } = await this.openRowName(row);
        if (rowName !== 'data') {
          const cellRow = await this.getCellRow(row);
          await browser.wait(cellRow.isPresent(), browser.params.defaultTimeout).catch((err) => {
            reject(err);
            return;
          });
          await cellRow.click();
          await browser.wait(this.until.presenceOf(this.getDetailsHeader(rowName)), browser.params.defaultTimeout);
          const layer = await this.getLayersFromGraphs(rowName, rowType, executionGraph, irGraph, comparisonGraph);
          const checkSideBar: string | false = await this.checkParamsInSidebar(layer);
          if (checkSideBar) {
            rowsWithError.push(checkSideBar);
          }
        }
      }
      console.log('Checked finish');
      resolve(rowsWithError);
      return;
    });
  }

  getLayersFromGraphs(rowName, rowType, execGraph, irGraph, execComparisonGraph?) {
    const execLayer = execGraph.find((el) => {
      return el.name === rowName && el.type === rowType;
    });
    let comparisonLayer;
    if (execComparisonGraph) {
      comparisonLayer = execComparisonGraph.find((el) => {
        return el.name === rowName;
      });
    }
    const irLayer = execLayer ? this.getIrLayers(execLayer, irGraph) : this.getIrLayers(execComparisonGraph, irGraph);
    return {
      execLayer,
      irLayer,
      comparisonLayer,
    };
  }

  getIrLayers(execLayer, irGraph) {
    const result = [];
    if (execLayer.data && execLayer.data.originalLayersNames !== '') {
      const irNames = execLayer.data.originalLayersNames.split(',');
      irNames.forEach((irName) => {
        result.push(irGraph.find((el) => el.name === irName));
      });
    } else {
      result.push(irGraph.find((el) => el.name === execLayer.name));
    }
    return result;
  }

  async checkParamsInSidebar(layer): Promise<string | false> {
    if (await this.labelsTabsHeader.isPresent()) {
      const tabs = await this.labelsTabs;
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        await browser.wait(this.until.presenceOf(tab), browser.params.defaultTimeout);
        await tab.click();
        await browser.wait(this.until.presenceOf(this.layerDetails), browser.params.defaultTimeout);
        const executOnDevice = await this.layerNotAvailable.isPresent();
        if (!executOnDevice) {
          return await this.equalLayerAndTabData(layer, Boolean(i));
        }
      }
    } else {
      return await this.equalLayerAndTabData(layer);
    }
  }

  async equalLayerAndTabData(layer, comparison?): Promise<string | false> {
    return new Promise(async (resolve, reject) => {
      let parametrsDiv = this.executeParametrsContainer;
      const nameFn = new ParameterNamePipe();
      await browser.wait(await this.until.presenceOf(parametrsDiv), browser.params.defaultTimeout);
      const currentLayer = comparison ? layer.comparisonLayer : layer.execLayer;
      if (currentLayer.data && (await this.paramsNotEqual(currentLayer.data, parametrsDiv, nameFn))) {
        resolve(currentLayer.name);
        return;
      }
      if (layer.irLayer && layer.irLayer[0]) {
        for (let i = 0; i < layer.irLayer.length; i++) {
          let ir;
          if (layer.irLayer[i].data) {
            ir = layer.irLayer[i];
          } else {
            continue;
          }
          parametrsDiv = this.getFusedParametrsContainer(ir.name);
          if (await this.paramsNotEqual(ir.data, parametrsDiv, nameFn)) {
            resolve(ir.name);
            return;
          }
        }
      }
      resolve(false);
      return;
    });
  }

  async paramsNotEqual(data, container, nameFn) {
    for (const parameterName in data) {
      if (parameterName === 'originalLayersNames') {
        continue;
      }
      let dataValue;
      const parameterValue = await this.getParameterValue(container, nameFn.transform(parameterName));
      switch (parameterName) {
        case 'execTimeMcs':
          dataValue =
            data[parameterName] === 'not_executed' ? 'Not Executed' : Number((data[parameterName] / 1000).toFixed(5));
          break;
        case 'negative_slope':
          dataValue = Number(data[parameterName]);
          break;
        default:
          dataValue = data[parameterName];
      }
      const formatValue = (value: string): string => value.replace(', ', ',');
      if (formatValue(parameterValue) !== formatValue(dataValue.toString())) {
        console.log(`parameter:${parameterName}     graph:${dataValue.toString()}     table:${parameterValue}`);
        return true;
      }
    }
  }

  async tableIsLoaded(table) {
    return new Promise(async (resolve, reject) => {
      const result = (await table.all(by.css('.mat-row')).count()) > 0;
      resolve(result);
      return;
    });
  }

  async clickFirsRow(table) {
    await browser.wait(async () => await this.tableIsLoaded(table), browser.params.defaultTimeout);
    const cellName = await this.getLayerTableRows(table).first().element(by.className('layer-name-cell'));
    await cellName.click();
  }

  async checkLayerDistribution(referenceDistribution: Object) {
    await this.analyzeTab.click();
    await browser.sleep(500);
    await this.performanceSubTab.click();
    await browser.sleep(700);

    await browser.wait(this.until.presenceOf(this.metricsRibbon));
    await this.metricsRibbon.click();

    await browser.wait(this.until.presenceOf(this.expandPerLayerDistributionTable));
    console.log('Checking layer distribution.');

    // Expand table
    await new TestUtils().clickElement(this.expandPerLayerDistributionTable);
    const layerInfoRows = await TestUtils.getAllElementsByDataTestId('layer-info-row');

    for (const row of layerInfoRows) {
      const layerType = await TestUtils.getNestedElementByDataTestId(row, 'layerType').getText();
      const percentage = await TestUtils.getNestedElementByDataTestId(row, 'percentage').getText();
      const fp32LayerCount = await TestUtils.getNestedElementByDataTestId(
        row,
        `${layerType}_FP32-layer-count`
      ).getText();
      const fp16LayerCount = await TestUtils.getNestedElementByDataTestId(
        row,
        `${layerType}_FP16-layer-count`
      ).getText();
      const int8LayerCount = await TestUtils.getNestedElementByDataTestId(
        row,
        `${layerType}_INT8-layer-count`
      ).getText();

      expect(parseFloat(percentage) >= 0).toBeTruthy('Percentage is not represented as number.');
      // Compare with reference values
      expect(referenceDistribution['layers'].includes(layerType)).toBeTruthy(
        `${layerType} is not in reference layers distribution.`
      );

      expect(parseInt(fp32LayerCount, 10)).toEqual(
        referenceDistribution['fp32LayerCount'][layerType] || 0,
        `${layerType} layers count is incorrect.
        REFERENCE: ${referenceDistribution['fp32LayerCount'][layerType] || 0}, ACTUAL: ${parseInt(fp32LayerCount, 10)}`
      );

      expect(parseInt(fp16LayerCount, 10)).toEqual(
        referenceDistribution['fp16LayerCount'][layerType] || 0,
        `${layerType} layers count is incorrect.
        REFERENCE: ${referenceDistribution['fp16LayerCount'][layerType] || 0}, ACTUAL: ${parseInt(fp16LayerCount, 10)}`
      );

      expect(parseInt(int8LayerCount, 10)).toEqual(
        referenceDistribution['int8LayerCount'][layerType] || 0,
        `${layerType} layers count is incorrect.
        REFERENCE: ${referenceDistribution['int8LayerCount'][layerType] || 0}, ACTUAL: ${parseInt(int8LayerCount, 10)}`
      );
    }
    console.log('Layer distribution checked.');
  }

  async checkPrecisionDistribution(referenceDistribution: object): Promise<boolean> {
    await this.analyzeTab.click();

    await browser.wait(this.until.presenceOf(this.precisionRibbon));
    await this.precisionRibbon.click();

    await browser.wait(this.until.presenceOf(this.precisionDistributionTable));

    for (const precision of referenceDistribution['precisions']) {
      // Check that precision is present in table
      expect(await TestUtils.getElementByDataTestId(`${precision}_precision`).isPresent()).toBeTruthy(
        `${precision} is not present in precision distribution table.`
      );

      // Check that total percentage is displayed
      const precisionTotalPercentage: string = await TestUtils.getElementByDataTestId(
        `${precision}_total-distribution`
      ).getText();
      expect(parseFloat(precisionTotalPercentage) > 0).toBeTruthy('Total percentage is not shown or is not numeric.');
    }

    // Check transition matrix
    for (const transitionPrecision of referenceDistribution['transitionMatrix']['precisions']) {
      // Check that column and row are present for given precision
      expect(await TestUtils.getElementByDataTestId(`column_${transitionPrecision}`).isPresent()).toBeTruthy(
        `There is no column for ${transitionPrecision}.`
      );
      expect(await TestUtils.getElementByDataTestId(`row_${transitionPrecision}`).isPresent()).toBeTruthy(
        `There is no row for ${transitionPrecision}.`
      );

      // Check that cells in table display the correct transitions number
      for (const transitionPrecisionSecond of referenceDistribution['transitionMatrix']['precisions']) {
        if (transitionPrecision === transitionPrecisionSecond) {
          continue;
        }
        const transitionMap = `${transitionPrecision}_to_${transitionPrecisionSecond}`;
        const transitionsActual: number = parseInt(await TestUtils.getElementByDataTestId(transitionMap).getText(), 10);

        expect(transitionsActual).toEqual(
          referenceDistribution['transitionMatrix']['transitions'][transitionMap] || 0,
          `Transition numbers in matrix do not match.
          REFERENCE: ${
            referenceDistribution['transitionMatrix']['transitions'][transitionMap] || 0
          }, ACTUAL: ${transitionsActual}`
        );
      }
    }
    console.log('Precision distribution checked.');
    return true;
  }

  async goToComparison() {
    console.log('Preparing to go to the comparison.');
    await browser.wait(this.compareBtn.isPresent());
    await this.compareBtn.click();
    console.log('Clicked "Comparison" button.');
  }

  async isAdviseClosed(adviceId: string): Promise<boolean> {
    // Check that elements are not visible
    return (
      !(await this.getAdviceSummary(adviceId).isDisplayed()) && !(await this.getAdviceNextSteps(adviceId).isDisplayed())
    );
  }

  async isAdviceOpened(adviceId: string): Promise<boolean> {
    // Check that elements are visible
    return (
      (await this.getAdviceSummary(adviceId).isDisplayed()) && (await this.getAdviceNextSteps(adviceId).isDisplayed())
    );
  }

  async isPlaceholderInAdvice(advice: string): Promise<boolean> {
    // There can be placeholders of type: '${fp16Count}'
    // So there cannot be nor placeholder nor special symbols
    return !!this.placeholderRegExp.exec(advice);
  }

  async checkAdvice(adviceCheckingParams: {
    adviceLevel: number;
    isTheoryPresent: boolean;
    numberOfAdviceContainers: number;
    adviceId: string;
  }): Promise<boolean> {
    console.log(`Checking ${adviceCheckingParams.adviceId}`);

    // Check that the number of advice containers is correct
    expect(await this.adviceExpanders.count()).toEqual(adviceCheckingParams.numberOfAdviceContainers);

    const actualSummaryEl: ElementFinder = await this.getAdviceSummary(adviceCheckingParams.adviceId);
    const actualSummary: string = await actualSummaryEl.getText();
    expect((await actualSummaryEl.isPresent()) && actualSummary).toBeTruthy(
      `Incorrect or no message for summary. ACTUAL: ${actualSummary}`
    );

    // Check for placeholders
    expect(this.isPlaceholderInAdvice(actualSummary)).toBeFalsy(
      `There is a placeholder in summary. ACTUAL: ${actualSummary}`
    );

    const actualNextStepsEl: ElementFinder = await this.getAdviceNextSteps(adviceCheckingParams.adviceId);
    const actualNextSteps: string = await actualNextStepsEl.getText();
    expect((await actualNextStepsEl.isPresent()) && actualNextSteps).toBeTruthy(
      `Incorrect or no message for next steps. ACTUAL: ${actualNextSteps}`
    );

    // Check for placeholders
    expect(this.isPlaceholderInAdvice(actualNextSteps)).toBeFalsy(
      `There is a placeholder in next steps. ACTUAL: ${actualNextSteps}`
    );

    if (adviceCheckingParams.isTheoryPresent) {
      const actualTheoryEl: ElementFinder = await this.getAdviceTheory(adviceCheckingParams.adviceId);
      const actualTheory: string = await actualTheoryEl.getText();
      expect((await actualTheoryEl.isPresent()) && actualTheory).toBeTruthy(
        `Incorrect or no message for theory. ACTUAL: ${actualTheory}`
      );

      // Check for placeholders
      expect(this.isPlaceholderInAdvice(actualTheory)).toBeFalsy(
        `There is a placeholder in next theory. ACTUAL: ${actualTheory}`
      );
    }

    // Close advising container, check that it was closed
    await new TestUtils().clickElement(this.adviceExpanders.get(adviceCheckingParams.adviceLevel));
    await browser.sleep(700);
    expect(await this.isAdviseClosed(adviceCheckingParams.adviceId)).toBeTruthy('Advising container is not closed.');
    console.log('Advising container is closed.');

    // Open advising container, check that everything is shown
    await new TestUtils().clickElement(this.adviceExpanders.get(adviceCheckingParams.adviceLevel));
    await browser.sleep(700);
    expect(await this.isAdviceOpened(adviceCheckingParams.adviceId)).toBeTruthy('Advising container is not opened.');
    console.log('Advising container is opened.');

    return true;
  }
}
