import { browser, by, element, ElementArrayFinder, ElementFinder, protractor } from 'protractor';

import { ModelGraphType } from '@store/model-store/model.model';

import {
  GraphColoringLabels,
  GraphExecTimeColors,
  NotExecutedLayerColor,
  PrecisionLabelToColorMap,
} from '@shared/models/netron';

import { TestUtils } from './test-utils';
import { NetronLayer } from '../netron.e2e-spec';

export class NetronGraph {
  until = protractor.ExpectedConditions;
  public readonly netronNodeIdPrefix = 'node-name-';
  public readonly testLayerName = 'pool10/reduce';
  public readonly selectLayerClass = '.select';
  private readonly notExecutedLayerColor = NotExecutedLayerColor;
  private readonly executionTimeColors = GraphExecTimeColors;
  private readonly precisionColors = Object.values(PrecisionLabelToColorMap);

  private coloringFunctional = {
    [GraphColoringLabels.BY_EXECUTION_TIME]: [...this.executionTimeColors, this.notExecutedLayerColor],
    [GraphColoringLabels.BY_RUNTIME_PRECISION]: this.precisionColors,
    [GraphColoringLabels.BY_OUTPUT_PRECISION]: this.precisionColors,
  };

  nodeIdToLayerName(nodeId: string): string {
    return nodeId.replace(this.netronNodeIdPrefix, '');
  }

  rgbToHex(rgb: string): string {
    const rgbValues = rgb.match(new RegExp('\\d+', 'g'));
    const hex = rgbValues
      .map((color) => {
        const colorToHex = Number(color).toString(16);
        return colorToHex.length === 1 ? `0${colorToHex}` : colorToHex;
      })
      .join('');
    return `#${hex}`;
  }

  getDownloadField(modelGraphType: ModelGraphType): ElementFinder {
    return TestUtils.getElementByDataTestId(`${modelGraphType}-download-field`);
  }

  getSearchLayerInput(modelGraphType: ModelGraphType): ElementFinder {
    return TestUtils.getElementByDataTestId(`${modelGraphType}-search-layer`);
  }

  getColoringField(modelGraphType: ModelGraphType): ElementFinder {
    return TestUtils.getElementByDataTestId(`${modelGraphType}-coloring-field`);
  }

  getDetailsLayerButton(layerElement: ElementFinder): ElementFinder {
    return layerElement.element(by.className('details'));
  }

  getNetronGraphSvgElement(modelGraphType: ModelGraphType): ElementFinder {
    return TestUtils.getElementByDataTestId(`graph-${modelGraphType}`);
  }

  getNetronNodeElements(netronSvgElement: ElementFinder, selectClass: string = ''): ElementArrayFinder {
    return netronSvgElement.all(by.css(`.graph-node${selectClass}, .graph-input${selectClass}`));
  }

  async getNetronLayersNames(netronSvgElement: ElementFinder, selectClass: string = ''): Promise<string[]> {
    const nodesElements = this.getNetronNodeElements(netronSvgElement, selectClass);
    return nodesElements.map(async (node) => {
      const nodeId = await node.getAttribute('id');
      return this.nodeIdToLayerName(nodeId);
    });
  }

  async getSelectedRowNameInTable(table: ElementFinder): Promise<string> {
    const selectedRow = table.element(by.css('.mat-row.selected'));
    const rowName = await selectedRow.element(by.className('cdk-column-layerName')).getText();
    return rowName;
  }

  async getLayerParameters(group: ElementFinder): Promise<ElementArrayFinder> {
    await browser.sleep(500);
    return group.all(by.className('parameter'));
  }

  async getLayerParameterData(parameter: ElementFinder): Promise<{ name: string; value: string }> {
    const nameElement = await parameter.element(by.className('name'));
    await browser.wait(this.until.presenceOf(nameElement), browser.params.defaultTimeout);
    const name = await nameElement.getText();

    const valueElement = await parameter.element(by.className('value'));
    await browser.wait(this.until.presenceOf(valueElement), browser.params.defaultTimeout);
    const value = await valueElement.getText();
    return { name: name, value: value };
  }

  async selectValueFromDropdown(el: ElementFinder, value: string, option = 'mat-option-text'): Promise<void> {
    await browser.sleep(1000);
    await browser.wait(this.until.elementToBeClickable(el), 7000);
    await new TestUtils().clickElement(el);
    await browser.sleep(1500);
    const optionElement = await element(by.cssContainingText(`.${option}`, value));
    await browser.wait(this.until.presenceOf(optionElement), 7000);
    await new TestUtils().clickElement(optionElement);
  }

  async netronGraphIsLoaded(netronSvgElement: ElementFinder): Promise<boolean> {
    return (await netronSvgElement.all(by.css('.node')).count()) > 0;
  }

  async areLayersPresentInNetronGraph(graphLayers: NetronLayer[], modelGraphType: ModelGraphType): Promise<boolean> {
    const netronSvgElement = await this.getNetronGraphSvgElement(modelGraphType);
    console.log(`waiting for ${modelGraphType} netron graph`);
    await browser
      .wait(async () => await this.netronGraphIsLoaded(netronSvgElement), browser.params.defaultTimeout)
      .catch((err) => {
        throw new Error('Failed on waiting renders netron model, err: ' + err);
      });
    console.log(`${modelGraphType} netron graph was shown`);
    const netronLayersNames = await this.getNetronLayersNames(netronSvgElement);
    const renderedLayers = graphLayers.reduce((acc, layer) => {
      if (netronLayersNames.includes(layer.name)) {
        acc.push(layer.name);
      }
      return acc;
    }, []);
    console.log(`Checked ${modelGraphType} netron nodes`);
    return renderedLayers.length === graphLayers.length;
  }

  async compareRuntimeSelectedLayers(): Promise<boolean> {
    const runtimeSvgElement = await this.getNetronGraphSvgElement(ModelGraphType.RUNTIME);
    const table = await new TestUtils().inferenceCard.layersTable;
    const [selectedLayerInRuntimeGraph] = await this.getNetronLayersNames(runtimeSvgElement, this.selectLayerClass);
    const selectedLayerInTable = await this.getSelectedRowNameInTable(table);
    console.log('Checked selected layers');
    return selectedLayerInRuntimeGraph === selectedLayerInTable;
  }

  async selectLayerCellInTable(layerName: string): Promise<void> {
    const table = await new TestUtils().inferenceCard.layersTable;
    const [selectedLayerCellName] = await table.all(by.className('layer-name-cell')).filter(async (cell) => {
      const name = await cell.getText();
      return name === layerName;
    });
    await new TestUtils().clickElement(selectedLayerCellName);
  }

  async checkDownloadFunctional(modelGraphType: ModelGraphType, modelName: string, format: string): Promise<boolean> {
    const downloadField = await this.getDownloadField(modelGraphType);
    const filePath = await new TestUtils().getFilePath(modelName, format);
    await this.selectValueFromDropdown(downloadField, format, 'mat-menu-item');
    return await new TestUtils().isFileDownloaded(filePath);
  }

  async checkSearchFunctional(modelGraphType: ModelGraphType): Promise<boolean> {
    const svgElement = await this.getNetronGraphSvgElement(modelGraphType);
    const searchLayerInput: ElementFinder = await this.getSearchLayerInput(modelGraphType);

    await searchLayerInput.sendKeys(this.testLayerName);
    await this.selectValueFromDropdown(searchLayerInput, this.testLayerName);
    await browser.sleep(2000);
    const [selectLayerName] = await this.getNetronLayersNames(svgElement, this.selectLayerClass);
    console.log(`Checked ${modelGraphType} search functional`);
    return selectLayerName === this.testLayerName;
  }

  async checkColoringFunctional(modelGraphType: ModelGraphType, option: string): Promise<boolean> {
    const svgElement = await this.getNetronGraphSvgElement(modelGraphType);
    const coloringField = await this.getColoringField(modelGraphType);

    await this.selectValueFromDropdown(coloringField, option);
    await browser.sleep(2000);
    const nodeElement = await svgElement.element(by.id(`${this.netronNodeIdPrefix}${this.testLayerName}`));
    const pathElement = await nodeElement.element(by.css('.node-item path'));
    const fillValue = await pathElement.getCssValue('fill');
    const hexFillValue = this.rgbToHex(fillValue);
    return this.coloringFunctional[option].includes(hexFillValue);
  }

  async checkTrackingFunctional(testIrLayers: NetronLayer[]): Promise<boolean> {
    await this.selectLayerCellInTable(this.testLayerName);
    await browser.sleep(500);

    const originalSvgElement = this.getNetronGraphSvgElement(ModelGraphType.ORIGINAL);
    const tableToRuntimeTracking = await this.compareRuntimeSelectedLayers();
    const selectedIrLayersNames = await this.getNetronLayersNames(originalSvgElement, this.selectLayerClass);
    const selectedTestIrLayers = testIrLayers
      .map((testIrLayer) => testIrLayer.name)
      .filter((testLayerName) => selectedIrLayersNames.includes(testLayerName));
    console.log('Checked tracking between table and graphs');
    return tableToRuntimeTracking && selectedTestIrLayers.length === testIrLayers.length;
  }

  async validateLayerParams(layerProperties: NetronLayer | object, param: string): Promise<void> {
    const data: ElementFinder = await TestUtils.getElementByDataTestId(param);
    const layerParameters = await this.getLayerParameters(data);

    if (!layerParameters.length) {
      throw new Error(`No layer parameters found for ${param}`);
    }

    layerParameters.forEach(async (layerParameter) => {
      const { name, value } = await this.getLayerParameterData(layerParameter);
      const paramName = name.charAt(0).toLowerCase() + name.slice(1, -1);
      expect(Object.keys(layerProperties).includes(paramName) && layerProperties[paramName] === value).toBeTruthy(
        `Layer doesn't have parameter: ${paramName} or parameter has incorrect value`
      );
    });
  }

  async validateLayerProperties(layer: NetronLayer): Promise<void> {
    await this.validateLayerParams(layer, 'properties');
    await this.validateLayerParams(layer.data, 'attributes');
  }
}
