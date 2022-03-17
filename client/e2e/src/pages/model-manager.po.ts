import { browser, by, element, ElementFinder, protractor } from 'protractor';

import {
  ModelDomain,
  modelDomainNames,
  modelFrameworkNamesMap,
  ModelFrameworks,
  TransformationsConfigType,
} from '@store/model-store/model.model';

import { layoutFieldNamesValuesMap } from '@shared/components/dimensions-layouts/dimensions-layouts.component';

import { TestUtils } from './test-utils';
import { Helpers } from './helpers';
import { ConfigurationWizardPage } from './configuration-wizard.po';
import {
  ColorSpace,
  FrameworkType,
  isMXNetModel,
  isTensorFlowModel,
  isTensorFlowV2Model,
  ModelFile,
} from './model-file';
import {
  LayoutTypeNamesByTypeMap,
  LayoutTypes,
} from '../../../src/app/modules/model-manager/components/model-manager-convert/input-output-layer-control/input-layer-fields';

const path = require('path');

export class ModelManagerPage {
  until = protractor.ExpectedConditions;
  helpers: Helpers;
  configurationWizard: ConfigurationWizardPage;

  constructor() {
    this.helpers = new Helpers();
    this.configurationWizard = new ConfigurationWizardPage();
  }

  get modelManagerButton() {
    return TestUtils.getElementByDataTestId('import-from-model-manager');
  }

  get uploadModelTab(): ElementFinder {
    return TestUtils.getElementByDataTestId('original_model');
  }

  get OMZTab(): ElementFinder {
    return TestUtils.getElementByDataTestId('open_model_zoo');
  }

  get modelFrameworkContainer() {
    return element(by.id('framework'));
  }

  get modelDomainContainer(): ElementFinder {
    return TestUtils.getElementByDataTestId('domain-form-field');
  }

  get inputFilesTypeContainer(): ElementFinder {
    return element(by.id('inputFilesType'));
  }

  get modelNameInputField() {
    return element(by.id('modelName'));
  }

  get xmlFileInput() {
    return element(by.id('xmlFileInput'));
  }

  get binFileInput() {
    return element(by.id('binFileInput'));
  }

  get prototxtFileInput() {
    return element(by.id('prototxtFileInput'));
  }

  get caffemodelFileInput() {
    return element(by.id('caffemodelFileInput'));
  }

  get jsonFileInput() {
    return element(by.id('jsonFileInput'));
  }

  get paramsFileInput() {
    return element(by.id('paramsFileInput'));
  }

  get onnxFileInput() {
    return element(by.id('onnxFileInput'));
  }

  get pipelineConfigFileInput() {
    return TestUtils.getElementByDataTestId('pipelineConfigFileInput');
  }

  get transformationsConfigFileInput() {
    return TestUtils.getElementByDataTestId('customTransformationsConfigInput');
  }

  get frozenGraphFileInput() {
    return element(by.id('frozenGraphFileInput'));
  }

  get pbFileInput() {
    return element(by.id('pbFileInput'));
  }

  get checkpointFileInput() {
    return element(by.id('checkpointFileInput'));
  }

  get metaFileInput() {
    return element(by.id('metaFileInput'));
  }

  get indexFileInput() {
    return element(by.id('indexFileInput'));
  }

  get dataFileInput() {
    return element(by.id('dataFileInput'));
  }

  get savedModelDirInput() {
    return element(by.id('savedModelDirInput'));
  }

  get kerasModelInput() {
    return element(by.id('kerasModelInput'));
  }

  get importModelButton() {
    return TestUtils.getElementByDataTestId('import-model-button');
  }

  get importModelContainer() {
    return element(by.className('import-model-tab-container'));
  }

  get precisionContainer() {
    return element(by.id('dataType'));
  }

  get colourSpaceContainer() {
    return element(by.id('originalChannelsOrder'));
  }

  get convertButton() {
    return TestUtils.getElementByDataTestId('convert-button');
  }

  get usageContainer() {
    return element(by.id('taskType'));
  }

  get saveAccuracyButton() {
    return TestUtils.getElementByDataTestId('save-accuracy');
  }

  get runAccuracyCheckButton() {
    return TestUtils.getElementByDataTestId('run-accuracy-check');
  }

  get modelSubType() {
    return element(by.id('taskMethod'));
  }

  get modelTag() {
    return element(by.id('yoloType'));
  }

  get metricType() {
    return element(by.id('type'));
  }

  get integralType() {
    return element(by.id('integral'));
  }

  get topKParam() {
    return element(by.id('top_k'));
  }

  get inverseMaskYesOption() {
    return element(by.id('Yes'));
  }

  get hasBackground() {
    return element(by.id('has_background'));
  }

  get labelToClassMapping() {
    return element(by.xpath('//*[@id="use_full_label_map"]'));
  }

  get isFrozen() {
    return element(by.id('isFrozenModel'));
  }

  get isLegacy() {
    return element(by.id('legacyMxnetModel'));
  }

  get useOutputsCheckBox() {
    return element(by.id('useOutputs'));
  }

  get enableSSDGluoncvCheckBox() {
    return element(by.id('enableSsdGluoncv'));
  }

  get addDimensionButton() {
    return TestUtils.getElementByDataTestId('add-dimension');
  }

  get editButton() {
    return TestUtils.getElementByDataTestId('edit-model-convert-button');
  }

  get modelConversionForm() {
    return TestUtils.getElementByDataTestId('model-conversion-form');
  }

  get firstOverrideShape() {
    return element.all(by.css('wb-config-form-field mat-checkbox[data-test-id="overrideShape"]')).first();
  }

  get useMeansButton() {
    return element(by.css('[id^=useMeans]'));
  }

  get useScalesButton() {
    return element(by.css('[id^=useScales]'));
  }

  get useTransformationsConfig(): ElementFinder {
    return TestUtils.getElementByDataTestId('use-transformations-config');
  }

  get usePipelineConfig(): ElementFinder {
    return TestUtils.getElementByDataTestId('use-pipeline-config');
  }

  get isSpecifyInputs() {
    return TestUtils.getElementByDataTestId('specify-inputs');
  }

  get validateButton(): ElementFinder {
    return TestUtils.getElementByDataTestId('validate-and-import');
  }

  get layoutTypeNHWC(): ElementFinder {
    return TestUtils.getElementByDataTestId('NHWC');
  }

  get layoutTypeNCHW(): ElementFinder {
    return TestUtils.getElementByDataTestId('NCHW');
  }

  get layoutTypeOther(): ElementFinder {
    return TestUtils.getElementByDataTestId('Other');
  }

  get generalParameters(): ElementFinder {
    return TestUtils.getElementByDataTestId('general-parameters');
  }

  get reshapeErrorBox(): ElementFinder {
    return TestUtils.getElementByDataTestId('reshape-error-box');
  }

  get layoutSelect(): ElementFinder {
    return TestUtils.getElementByDataTestId('layout-form-field');
  }

  async isValidateButtonDisabled(): Promise<Boolean> {
    return (await this.validateButton.element(by.css('button')).getAttribute('disabled')) === 'true';
  }

  async isConvertButtonDisabled(): Promise<Boolean> {
    return (await this.convertButton.getAttribute('disabled')) === 'true';
  }

  getTransformationsConfigTypeElement(type: TransformationsConfigType): ElementFinder {
    return TestUtils.getElementByDataTestId('transformations-config-type-' + type);
  }

  async selectInputLayerType(type: string): Promise<void> {
    await this.selectValueFromDropdown(this.layoutSelect, type);
  }

  async selectPreConfiguredConfigurationFile(name: string): Promise<void> {
    const { isChecked } = await TestUtils.getCheckboxState(this.useTransformationsConfig);
    if (!isChecked) {
      await this.useTransformationsConfig.click();
    }
    const row = await TestUtils.getElementByDataTestId(`transformations-config-${name}`);
    await browser.wait(this.until.elementToBeClickable(row), browser.params.defaultTimeout);
    await row.click();
    expect(await this.isParameterSatisfied('predefinedTransformationsConfig-tip')).toBeTruthy(
      'Predefined Configuration File tip should show that Predefined Configuration File is filled'
    );
  }

  async clickUseMeansCheckBox() {
    await this.useMeansButton.click();
  }

  async clickUseScalesCheckBox() {
    await this.useScalesButton.click();
  }

  async isParameterSatisfied(fieldCss) {
    const component = await TestUtils.getElementByDataTestId(fieldCss);
    const tip = await TestUtils.getNestedElementByDataTestId(component, 'tip-status');
    const status = await tip.getAttribute('data-mat-icon-name');

    return status !== 'warning';
  }

  async clickMoreTips(fieldCss) {
    const field = await element(by.css(`a[data-test-id="${fieldCss}"]`));
    await field.click();
    const tipName = fieldCss.substring(5, fieldCss.length - 4);
    await console.log(`Learn more for ${tipName} is clicked.`);
  }

  async isTipExpanded(itemTestId) {
    const item = await TestUtils.getElementByDataTestId(itemTestId);
    const panel = await TestUtils.getNestedElementByDataTestId(item, 'tip-panel');
    const className = await panel.getAttribute('class');

    return className.indexOf('mat-expanded') !== -1;
  }

  async checkTipExpand(fieldCss: string, edit?: boolean): Promise<void> {
    if (!edit) {
      await expect(await this.isTipExpanded(fieldCss)).toBeFalsy();
    }
    await this.clickMoreTips(`more-${fieldCss}`);
    await browser.sleep(500);
    await expect(await this.isTipExpanded(fieldCss)).toBeTruthy();
  }

  get modelUploadPanel(): ElementFinder {
    return TestUtils.getElementByDataTestId('model-upload-tab');
  }

  get convertPanel() {
    return TestUtils.getElementByDataTestId('convert-tab');
  }

  get allLayerControl() {
    return element.all(by.css('wb-input-output-layer-control'));
  }

  inputsLayerControls() {
    return this.allLayerControl.filter(async (control) => {
      return (await control.getAttribute('layertype')) === 'input';
    });
  }

  getCurrentControlLayer(name, controls) {
    return controls
      .filter(async (control) => {
        return (await this.layerSelect(control).getAttribute('value')) === name;
      })
      .first();
  }

  getCurrentDimensionInput(id, currentLayer) {
    return TestUtils.getNestedElementByDataTestId(currentLayer, `input-dimension-${id + 1}`);
  }

  layerSelect(control) {
    return control.element(by.css('wb-select-autocomplete')).element(by.css('input'));
  }

  async checkingLayerControlAreas(backendData) {
    for (const layerName in backendData) {
      if (backendData[layerName]) {
        const resultCheckingArea = await this.checkControls(layerName, backendData[layerName]);
        await expect(resultCheckingArea).toBeTruthy();
      }
    }
  }

  async checkControls(layerName, shape) {
    await browser.wait(async () => {
      const inputsArray = await TestUtils.getAllElementsByDataTestId('dimension');
      return inputsArray.length > 0;
    }, browser.params.defaultTimeout);

    const currentLayer = await TestUtils.getElementsContainingDataTestIdPart('input-shape-form-')
      .filter(async (layer: ElementFinder) => {
        const layerInput: ElementFinder = await TestUtils.getNestedElementsContainingDataTestIdPart(
          layer,
          `input-layer-name-`
        ).first();
        if (!layerInput) {
          return false;
        }
        const value = String(await layerInput.getAttribute('value')).trim();
        return value === layerName;
      })
      .first();
    const currentLayerPresent = await currentLayer.isPresent();
    if (!currentLayerPresent) {
      console.log(`Not found layer ${layerName}`);
      return false;
    }

    const dimensions = await TestUtils.getAllNestedElementsByDataTestId(currentLayer, 'dimension');
    if (shape.length > 0) {
      for (let i = 0; i < shape.length; i++) {
        const dimensionInput = dimensions[i];
        await browser.wait(this.until.presenceOf(dimensionInput), browser.params.defaultTimeout);
        const dimensionInputValue = await dimensionInput.getAttribute('value');
        if (shape[i] !== Number(dimensionInputValue)) {
          console.log(`Inputs shape and test shape not equal: ${shape[i]} !== ${dimensionInputValue}`);
          return false;
        }
      }
    }
    return true;
  }

  async checkConvertPanelState(isDisabled: boolean) {
    const convertPanel = await this.convertPanel;
    console.log('Convert panel.');
    await browser.wait(this.until.presenceOf(convertPanel), browser.params.defaultTimeout);
    const currentState = await convertPanel.getAttribute('aria-disabled');

    expect(isDisabled.toString() === currentState).toBeTruthy(
      'Convert panel should be ' + isDisabled ? 'disabled' : 'enabled'
    );
  }

  async waitForEnvironmentPreparation() {
    console.log('Waiting for environment preparation to complete.');
    await browser.wait(async () => {
      const tabElement: ElementFinder = await TestUtils.getElementByDataTestId('prepare-environment-stage');
      const completeIcon: ElementFinder = await TestUtils.getNestedElementByDataTestId(
        tabElement,
        'model-status-ready'
      );
      return completeIcon.isPresent();
    }, browser.params.defaultTimeout * 11);
  }

  async waitForConversion(): Promise<void> {
    console.log('Waiting for the convert stage to complete.');
    await browser.wait(async () => {
      const tabElement: ElementFinder = await TestUtils.getElementByDataTestId('convert-stage');
      const completeIcon: ElementFinder = await TestUtils.getNestedElementByDataTestId(
        tabElement,
        'model-status-ready'
      );
      return completeIcon.isPresent();
    }, browser.params.defaultTimeout * 11);
    console.log('Convert stage is complete.');
  }

  async waitForModelConversionForm() {
    await browser.wait(
      () => {
        return this.modelConversionForm.isPresent();
      },
      browser.params.defaultTimeout * 2,
      'Import page: Model convert container is not present'
    );
  }

  async sendInput(fieldNumber, size, level) {
    const inputFieldNumber = await TestUtils.getAllElementsByDataTestId('input-dimension-' + fieldNumber).get(level);
    await browser.wait(this.until.presenceOf(inputFieldNumber), browser.params.defaultTimeout);
    await inputFieldNumber.clear();
    await inputFieldNumber.sendKeys(size);
  }

  async fillLayerName(layerIndex: number, layerName: string, type: 'input' | 'output') {
    const outputFieldNumber = await TestUtils.getElementByDataTestId(`${type}-layer-name-${layerIndex}`);
    await browser.wait(
      this.until.elementToBeClickable(outputFieldNumber),
      browser.params.defaultTimeout,
      `${type} layer with index ${layerIndex} should be present`
    );
    await outputFieldNumber.clear();
    await outputFieldNumber.sendKeys(layerName);
    // blur element
    await browser.actions().mouseMove(outputFieldNumber, { x: -2000, y: 0 }).click().perform();
  }

  async goToModelManager() {
    await this.configurationWizard.selectModelStage();
    console.log('Going to Model Manager');
    await browser.wait(async () => {
      return this.modelManagerButton.isPresent();
    }, browser.params.defaultTimeout);
    await new TestUtils().clickElement(this.modelManagerButton);
    await browser.wait(async () => {
      return new TestUtils().modelDownloadPage.modelDownloadTable.isPresent();
    }, browser.params.defaultTimeout);

    await console.log('Entered Model Manager');
  }

  async selectUploadModelTab() {
    await new TestUtils().clickElement(this.uploadModelTab);
  }

  async clickConvertButton() {
    await this.convertButton.click();
    await console.log('Convert Button is clicked.');
  }

  async clickEditButton(): Promise<void> {
    console.log('Try click edit');
    return new Promise(async (resolve, reject) => {
      do {
        try {
          await this.editButton.click();
          console.log('clicked edit');
          resolve();
          return;
        } catch (e) {
          console.log('Edit button is not attached to the page');
        }
      } while (true);
    });
  }

  async clickFirstOverrideShape() {
    await this.firstOverrideShape.click();
  }

  async clickIsFrozenBox() {
    await this.isFrozen.click();
  }

  async clickIsLegacy() {
    await this.isLegacy.click();
  }

  async selectIsSpecifyInputs() {
    const checkboxClasses = await this.isSpecifyInputs.getAttribute('class');

    if (checkboxClasses.includes('mat-checkbox-checked')) {
      return;
    }

    await this.isSpecifyInputs.click();
    await browser.sleep(500);
  }

  async selectValueFromDropdown(el, value) {
    await browser.sleep(1000);
    await browser.wait(this.until.elementToBeClickable(el), 5000);
    await el.click();
    await browser.sleep(500);
    const optionElement = await element(by.cssContainingText('.mat-option-text', `${value}`));
    await browser.wait(this.until.presenceOf(optionElement), 5000);
    await optionElement.click();
  }

  async selectFramework(framework: string) {
    await this.selectValueFromDropdown(this.modelFrameworkContainer, framework);
    await console.log(`Framework is selected: ${framework}.`);
  }

  async selectModelDomain(domain: string = 'CV'): Promise<void> {
    await this.selectValueFromDropdown(this.modelDomainContainer, domain);
    await console.log(`Selected domain: ${domain}.`);
  }

  async selectTFVersion(version: string) {
    const optionElement = await TestUtils.getElementByDataTestId(version);
    await optionElement.click();
    await console.log(`TF version is selected: ${version}.`);
  }

  async selectTFKeras() {
    const optionElement = await element(by.id('isKerasModel'));
    await optionElement.click();
    await console.log(`Keras mode is selected.`);
  }

  async selectPredefinedTransformationsConfig(config: string): Promise<void> {
    expect(await this.isParameterSatisfied('predefinedTransformationsConfig-tip')).toBeFalsy(
      'Config tip should not show that Predefined transformations config is filled'
    );
    const transformationsConfigRow = await element(
      by.cssContainingText('.transformations-config-row', `__REGEXP__/^${config}$/`)
    );
    const isConfigPresent = await transformationsConfigRow.isPresent();
    expect(isConfigPresent).toBeTruthy(`${config} config should exist in table`);
    if (isConfigPresent) {
      await transformationsConfigRow.click();
      expect(await this.isParameterSatisfied('predefinedTransformationsConfig-tip')).toBeTruthy(
        'Config tip should show that Predefined transformations config is filled'
      );
    }
  }

  async selectInputFilesForTF(type: string) {
    await this.selectValueFromDropdown(this.inputFilesTypeContainer, type);
  }

  async selectPrecision(type: string) {
    await this.selectValueFromDropdown(this.precisionContainer, type);
  }

  async selectColourSpace(type: string) {
    await this.selectValueFromDropdown(this.colourSpaceContainer, type);
  }

  async selectUsage(type: string) {
    await this.selectValueFromDropdown(this.usageContainer, type);
  }

  async makeFileInputVisible(fileType) {
    await browser.executeScript('arguments[0].style.display = "block"', fileType.getWebElement());
  }

  async setAdapter(adapter) {
    if (adapter.subType) {
      await this.selectValueFromDropdown(this.modelSubType, adapter.subType);
    }

    if (adapter.tag) {
      await this.selectValueFromDropdown(this.modelTag, adapter.tag);
    }
  }

  async setMetric(metric, taskType) {
    if (!metric) {
      return;
    }

    if (metric.integral) {
      await this.selectValueFromDropdown(this.integralType, metric.integral);
    }

    if (metric.name && taskType !== 'Classification') {
      await this.selectValueFromDropdown(this.metricType, metric.name);
    }

    if (metric.topK) {
      await this.topKParam.clear();
      await this.topKParam.sendKeys(+metric.topK);
    }
  }

  async setPreProcessing(preProcessing) {
    if (!preProcessing) {
      return;
    }
  }

  async setPostProcessing(postProcessing) {
    if (!postProcessing) {
      return;
    }
  }

  async setAnnotationConversion(annotationConversion, isNotAnnotatedDataset: boolean = false) {
    if (!annotationConversion) {
      return;
    }
    if (annotationConversion.hasBackground && !isNotAnnotatedDataset) {
      await this.selectValueFromDropdown(this.hasBackground, annotationConversion.hasBackground);
    }
    if (annotationConversion.mapping) {
      await this.selectValueFromDropdown(this.labelToClassMapping, annotationConversion.mapping);
    }
  }

  async setMaskInversion(maskInversion = false) {
    if (!maskInversion) {
      return;
    }

    await new TestUtils().clickElement(this.inverseMaskYesOption);
  }

  async fillModelAccuracyForm(accuracyData, isNotAnnotatedDataset: boolean = false) {
    await this.setAdapter(accuracyData.adapter);
    await this.setPreProcessing(accuracyData.preProcessing);
    await this.setPostProcessing(accuracyData.postProcessing);
    await this.setMetric(accuracyData.metric, accuracyData.adapter.taskType);
    await this.setAnnotationConversion(accuracyData.preProcessing, isNotAnnotatedDataset);
    await this.setMaskInversion(accuracyData.inverseMask);
  }

  async fillInputs(type, inputs, formNumber?: number) {
    switch (type) {
      case 'inputShape':
        if (!isNaN(formNumber)) {
          await browser.sleep(1000);
          const specifyInputShapeClasses = await this.firstOverrideShape.getAttribute('class');

          if (!specifyInputShapeClasses.includes('mat-checkbox-checked')) {
            await this.clickFirstOverrideShape();
          }

          const inputShapeCount = await TestUtils.getAllElementsByDataTestId(`input-shape-form-${formNumber}`)
            .all(by.css('[type="number"]'))
            .count();
          const addBtn = await this.addDimensionButton;
          for (let i = 0; i < inputs.length - inputShapeCount; i++) {
            await addBtn.click();
          }
        }

        for (let index = 0; index < inputs.length; index++) {
          await this.sendInput(index + 1, inputs[index], 0);
        }
        await this.checkTipExpand('inputs-tip');
        await new TestUtils().checkExternalLinkDialogWindow();

        await expect(this.isParameterSatisfied('inputs-tip')).toBeTruthy();
        break;

      case 'means':
        await this.clickUseMeansCheckBox();

        for (let index = 0; index < inputs.length; index++) {
          await this.sendInput(index + 1, inputs[index], 1);
        }

        await expect(this.isParameterSatisfied('inputs-tip')).toBeTruthy();
        break;

      case 'scales':
        await this.clickUseScalesCheckBox();

        for (let index = 0; index < inputs.length; index++) {
          const inputLevels = await TestUtils.getAllElementsByDataTestId(`input-dimension-${index + 1}`).count();
          await this.sendInput(index + 1, inputs[index], inputLevels - 1);
        }

        await expect(this.isParameterSatisfied('inputs-tip')).toBeTruthy();
        break;
    }
  }

  async fillInputShapesSecondLayer(inputs) {
    for (let index = 0; index < inputs.length; index++) {
      await this.sendInput(index + 1, inputs[index], 1);
    }
  }

  async fillInputShapesThirdLayer(inputs): Promise<void> {
    for (let index = 0; index < inputs.length; index++) {
      await this.sendInput(index + 1, inputs[index], 2);
    }

    // remove unused dimensions
    let i = inputs.length;
    while (await TestUtils.getAllElementsByDataTestId(`remove-dimension-${i}`).get(2).isPresent()) {
      await TestUtils.getAllElementsByDataTestId(`remove-dimension-${i}`).get(2).click();
      i++;
    }
  }

  async fillFreezePlaceholderWithValue(inputNumber: number, value: string): Promise<void> {
    await element
      .all(by.css('[id^=useFreezePlaceholderWithValue]'))
      .get(inputNumber * 2)
      .click();
    await TestUtils.getElementByDataTestId(`freeze-placeholder-input-${inputNumber}`).sendKeys(value);
  }

  async fillInputLayerNames(modelInputs) {
    for (let index = 0; index < modelInputs.length; index++) {
      await this.fillLayerName(index, modelInputs[index], 'input');
    }
  }

  async fillOutputLayers(modelOutputs) {
    if (!modelOutputs) {
      return;
    }
    const { isChecked: isOverrideOutputsChecked } = await TestUtils.getCheckboxState(this.useOutputsCheckBox);
    if (!isOverrideOutputsChecked) {
      await this.useOutputsCheckBox.click();
    }
    const outputsCount = modelOutputs.length;
    await this.adjustLayersForm('output', outputsCount);
    for (let index = 0; index < outputsCount; index++) {
      // Fill layer name
      await this.fillLayerName(index, modelOutputs[index], 'output');
    }
  }

  uploadsModelsTableElementsCount() {
    return element.all(by.css('[data-test-id="models-table"] tbody tr')).count();
  }

  uploadsDatasetsTableElementsCount() {
    return element.all(by.css('[data-test-id="datasets-table"] tbody tr')).count();
  }

  getAllLeftoversAssetsNames() {
    const rows = element.all(by.css('wb-models-list .table-row')).all(by.css('span[data-test-id="name"]'));
    return rows.map((el) => {
      return el.getText();
    });
  }

  async openOMZTab() {
    await this.OMZTab.click();
  }

  async selectAndUploadCustomTransformationsConfig(configPath: string): Promise<void> {
    await TestUtils.getElementByDataTestId('transformations-config-type-' + TransformationsConfigType.CUSTOM).click();
    await browser.sleep(500);

    // Check that 'Convert' button is disabled
    expect(await new TestUtils().isButtonClickable('convert-button')).toBeFalsy(
      'Convert button is enabled but it should not be.'
    );

    // Check that tooltip shows that parameter is not filled
    expect(await this.isParameterSatisfied('customTransformationsConfig-tip')).toBeFalsy(
      'Config tip shows that custom transformations config is filled in but it should not be.'
    );

    await this.makeFileInputVisible(this.transformationsConfigFileInput);
    await browser.wait(this.until.visibilityOf(this.transformationsConfigFileInput), browser.params.defaultTimeout);
    const absPath = path.resolve(__dirname, browser.params.precommit_scope.resource_dir, configPath);
    await this.transformationsConfigFileInput.sendKeys(absPath);
    await browser.sleep(1000);
    // Check that tooltip shows that parameter is not filled
    expect(await this.isParameterSatisfied('customTransformationsConfig-tip')).toBeTruthy(
      'Config tip should show that custom transformations config is filled'
    );
  }

  async fillImportForm(model: ModelFile, resourceDir: string): Promise<void> {
    const { conversionSettings } = model;
    if (conversionSettings.precision) {
      console.log('Set precision');
      await this.selectPrecision(conversionSettings.precision);
      expect(await this.isParameterSatisfied('dataType-tip')).toBeTruthy(
        'Precision tip should shows that precision drop down is filled'
      );
      await this.checkTipExpand('dataType-tip');
    }
    if (!model.domain || model.domain !== 'NLP') {
      console.log('Set color space');
      const colorSpace: ColorSpace = conversionSettings.colourSpace ? conversionSettings.colourSpace : 'RGB';
      const selectedColorSpace = await this.colourSpaceContainer.getText();
      if (!selectedColorSpace) {
        expect(await this.isParameterSatisfied('originalChannelsOrder-tip')).toBeFalsy(
          'Color Space tip should not shows that Color Space drop down is filled'
        );
      }
      await this.checkTipExpand('originalChannelsOrder-tip');
      await this.selectColourSpace(colorSpace);
      expect(await this.isParameterSatisfied('originalChannelsOrder-tip')).toBeTruthy(
        'Color Space tip should shows that Color Space drop down is filled'
      );
    }
    if (model.conversionSettings.dynamic) {
      return;
    }

    if (isTensorFlowModel(model)) {
      if (model.conversionSettings.ODAPI) {
        await this.uploadPipelineConfigFile(model.configPath, resourceDir);

        await this.checkTipExpand('pipelineConfigFile-tip');
        await this.checkTipExpand('predefinedTransformationsConfig-tip');
      }
      if (model.conversionSettings.modelTransformationsConfig) {
        await this.selectPredefinedTransformationsConfig(model.conversionSettings.modelTransformationsConfig);
      }
      if (model.conversionSettings.transformationsConfigPath) {
        const { isChecked: isTransformationsConfigChecked } = await TestUtils.getCheckboxState(
          this.useTransformationsConfig
        );
        if (!isTransformationsConfigChecked) {
          await this.useTransformationsConfig.click();
        }
        await this.selectAndUploadCustomTransformationsConfig(model.conversionSettings.transformationsConfigPath);
        expect(await this.isParameterSatisfied('customTransformationsConfig-tip')).toBeTruthy(
          'Transformations config is filled, tip should be green.'
        );
      }
      if (model.conversionSettings.originalLayout) {
        const layoutBtn = element(by.id(model.conversionSettings.originalLayout));
        await layoutBtn.click();
      }
    }
    if (isTensorFlowModel(model) || isMXNetModel(model)) {
      if (model.conversionSettings.preConfiguredConfigurationFile) {
        await this.selectPreConfiguredConfigurationFile(model.conversionSettings.preConfiguredConfigurationFile);
      }
    }

    if (isTensorFlowV2Model(model)) {
      if (model.conversionSettings.usePipelineConfig) {
        await this.usePipelineConfig.click();
        await browser.sleep(500);
        await this.uploadPipelineConfigFile(model.configPath, resourceDir);
        await this.checkTipExpand('pipelineConfigFile-tip');
      }
    }

    if (isMXNetModel(model)) {
      if (model.conversionSettings.legacy) {
        await this.clickIsLegacy();
      }

      if (model.conversionSettings.gluoncv) {
        await this.enableSSDGluoncvCheckBox.click();
      }
    }
    // fill input layers
    await this.fillLayers(model);
    // fill output layers
    await this.fillOutputLayers(model.conversionSettings.outputs);
    // check backend data
    if (model.backendData) {
      await this.checkingLayerControlAreas(model.backendData);
    }
  }

  async fillImportFormAndConvertModel(model: ModelFile, resourceDir: string): Promise<void> {
    await browser.wait(this.until.elementToBeClickable(this.precisionContainer), browser.params.defaultTimeout);
    await this.fillImportForm(model, resourceDir);
    await browser.wait(this.until.elementToBeClickable(this.convertButton), 5000, 'Convert button is not clickable');
    await this.clickConvertButton();

    await browser.sleep(1000);
  }

  async isUploadReady() {
    await browser.wait(
      this.until.presenceOf(element(by.className('status-bar-icon-ready'))),
      browser.params.defaultTimeout * 10
    );
  }

  async configureAccuracySettings(accuracyData) {
    await this.selectUsage(accuracyData.adapter.taskType);
    await this.fillModelAccuracyForm(accuracyData);
    await browser.wait(this.until.elementToBeClickable(this.saveAccuracyButton), 5000);
    await this.saveAccuracyButton.click();
    await console.log('Save button in Model Manager is clicked');
  }

  async configureAccuracySettingsAndSave(usage, accuracyData, isNotAnnotatedDataset: boolean = false) {
    await this.selectUsage(usage);
    await this.fillModelAccuracyForm(accuracyData, isNotAnnotatedDataset);
    await browser.wait(this.until.elementToBeClickable(this.saveAccuracyButton), 5000);
    await this.saveAccuracyButton.click();
    await console.log('Save button in edit accuracy is clicked');
  }

  async uploadFile(inputElement: ElementFinder, fileToUploadPath: string, resourceDir: string): Promise<void> {
    await this.makeFileInputVisible(inputElement);
    await browser.wait(this.until.visibilityOf(inputElement), browser.params.defaultTimeout);
    const fileAbsolutePath = path.resolve(__dirname, resourceDir, fileToUploadPath);
    await inputElement.sendKeys(fileAbsolutePath);
    await browser.sleep(1000);
  }

  async uploadModelFilesByFramework(framework: FrameworkType, fileToUpload, resource_dir: string) {
    switch (framework) {
      case 'OpenVINO IR': {
        // Upload .xml
        await this.uploadFile(this.xmlFileInput, fileToUpload.xmlPath, resource_dir);
        // Upload .bin
        await this.uploadFile(this.binFileInput, fileToUpload.binPath, resource_dir);
        break;
      }
      case 'Caffe': {
        // Upload .prototxt
        await this.uploadFile(this.prototxtFileInput, fileToUpload.protoTxtPath, resource_dir);
        // Upload .caffemodel
        await this.uploadFile(this.caffemodelFileInput, fileToUpload.modelPath, resource_dir);
        break;
      }
      case 'MxNet': {
        // Upload .json
        await this.uploadFile(this.jsonFileInput, fileToUpload.jsonPath, resource_dir);
        // Upload .params
        await this.uploadFile(this.paramsFileInput, fileToUpload.paramsPath, resource_dir);
        break;
      }
      case 'ONNX': {
        // Upload .onnx
        await this.uploadFile(this.onnxFileInput, fileToUpload.onnxPath, resource_dir);
        break;
      }
      case 'TensorFlow': {
        if (fileToUpload.conversionSettings.frozen) {
          //  Upload .pb OR .pbtxt
          await this.uploadFile(this.frozenGraphFileInput, fileToUpload.frozenPath, resource_dir);
        } else {
          await browser.wait(this.until.elementToBeClickable(this.isFrozen), 5000);
          await browser.sleep(2000);
          await this.clickIsFrozenBox();
          const isCheckPoint = fileToUpload.checkpointPath !== undefined;

          if (isCheckPoint) {
            //  Upload .pb OR .pbtxt
            await this.uploadFile(this.pbFileInput, fileToUpload.frozenPath, resource_dir);
            //  Upload .ckpt
            await this.uploadFile(this.checkpointFileInput, fileToUpload.checkpointPath, resource_dir);
          } else {
            await this.selectValueFromDropdown(this.inputFilesTypeContainer, 'MetaGraph');
            //  Upload .meta
            await this.uploadFile(this.metaFileInput, fileToUpload.metaPath, resource_dir);
            //  Upload .index
            await this.uploadFile(this.indexFileInput, fileToUpload.indexPath, resource_dir);
            //  Upload .data
            await this.uploadFile(this.dataFileInput, fileToUpload.dataPath, resource_dir);
          }
        }
        break;
      }
      case 'TensorFlow V2': {
        const isKerasModel = fileToUpload.h5path !== undefined;
        if (isKerasModel) {
          await this.selectTFKeras();
          await this.uploadFile(this.kerasModelInput, fileToUpload.h5path, resource_dir);
        } else {
          await this.uploadFile(this.savedModelDirInput, fileToUpload.savedModelDir, resource_dir);
        }
        break;
      }
    }
  }

  async importModel(framework: FrameworkType, fileToUpload: ModelFile, resource_dir: string): Promise<void> {
    // Select domain
    await this.selectModelDomain(fileToUpload.domain);
    const frameworkType =
      {
        'TensorFlow V2': 'TensorFlow',
        MxNet: 'MXNet',
      }[framework] || framework;
    await this.selectFramework(frameworkType);
    if (framework === 'TensorFlow V2') {
      await this.selectTFVersion('2.X');
    }
    // upload files
    await this.uploadModelFilesByFramework(framework, fileToUpload, resource_dir);
    // Set model name
    if (fileToUpload.name) {
      await this.modelNameInputField.clear();
      await this.modelNameInputField.sendKeys(fileToUpload.name);
    }
    await browser.sleep(1000);
    await this.importModelButton.click();
    if (framework === modelFrameworkNamesMap[ModelFrameworks.OPENVINO]) {
      const multiplier = browser.params.isDevCloud ? 5 : 2.5;
      if (fileToUpload.conversionSettings.irVersion < 11 || !fileToUpload.conversionSettings.inputLayers) {
        await browser.wait(
          async () => await this.configurationWizard.isUploadReady(fileToUpload.name),
          browser.params.defaultTimeout * multiplier,
          'Upload is not ready'
        );
      } else {
        // Wait for the convert stage
        await this.waitForConversion();
        if (fileToUpload.conversionSettings['incorrectLayers']) {
          await this.checkConfigureLayouts(fileToUpload);
        } else {
          const shouldSetLayouts = Boolean(fileToUpload.conversionSettings.setLayout);
          const shouldFillReshapeForm = Boolean(fileToUpload.conversionSettings.dynamic);
          await this.configureLayouts(fileToUpload, shouldFillReshapeForm, shouldSetLayouts);
        }
      }
    } else {
      await this.isUploadReady();
      await this.waitForModelConversionForm();
      await this.waitForEnvironmentPreparation();
    }
  }

  async validateModelInfo(
    fileToUpload,
    options: {
      shouldValidateSettings?: boolean;
      shouldValidateTheoreticalAnalysis?: boolean;
    } = { shouldValidateSettings: true, shouldValidateTheoreticalAnalysis: true }
  ) {
    await this.configurationWizard.showModelInfo();
    if (options.shouldValidateTheoreticalAnalysis) {
      await this.configurationWizard.validateTheoreticalAnalysis();
    }
    if (options.shouldValidateSettings) {
      await this.configurationWizard.validateConversionSettings(fileToUpload);
    }
    await browser.refresh();
    await browser.sleep(2000);
  }

  async uploadIRModel(fileToUpload: ModelFile, resource_dir: string): Promise<void> {
    await this.importModel('OpenVINO IR', fileToUpload, resource_dir);

    // Validation of model info
    await this.validateModelInfo(fileToUpload, {
      shouldValidateTheoreticalAnalysis: fileToUpload.validateTheoreticalAnalysis,
    });
  }

  async uploadDeprecatedIRModel(fileToUpload, resource_dir: string): Promise<string> {
    await this.selectFramework(modelFrameworkNamesMap[ModelFrameworks.OPENVINO]);
    // Upload .xml
    await this.uploadFile(this.xmlFileInput, fileToUpload.xmlPath, resource_dir);
    // Upload .bin
    await this.uploadFile(this.binFileInput, fileToUpload.binPath, resource_dir);
    // Set model name
    await this.modelNameInputField.clear();
    await this.modelNameInputField.sendKeys(fileToUpload.name);
    await browser.sleep(1000);
    await this.importModelButton.click();
    await browser.wait(
      async () => await this.configurationWizard.isUploadHasErrors(),
      browser.params.defaultTimeout,
      'Upload is not has errors'
    );
    return await new TestUtils().checkErrorStatus();
  }

  async uploadCaffeModel(fileToUpload: ModelFile, resource_dir: string, timeoutCoefficient = 1): Promise<void> {
    await this.importModel('Caffe', fileToUpload, resource_dir);
    await this.fillImportFormAndConvertModel(fileToUpload, resource_dir);
    if (!fileToUpload.conversionSettings.dynamic) {
      await browser.wait(
        async () => await this.configurationWizard.isUploadReady(fileToUpload.name),
        browser.params.defaultTimeout * timeoutCoefficient,
        'Upload is not ready'
      );
    } else {
      // Wait for the convert stage
      await this.waitForConversion();
      // TODO: add reshaping
    }

    // Validation of model info
    await this.validateModelInfo(fileToUpload);
  }

  async uploadMxNetModel(fileToUpload: ModelFile, resource_dir: string): Promise<void> {
    await this.importModel('MxNet', fileToUpload, resource_dir);

    await this.fillImportFormAndConvertModel(fileToUpload, resource_dir);

    if (!fileToUpload.conversionSettings.dynamic) {
      await browser.wait(
        async () => await this.configurationWizard.isUploadReady(fileToUpload.name),
        browser.params.defaultTimeout * 2,
        'Upload is not ready'
      );
    } else {
      // Wait for the convert stage
      await this.waitForConversion();
      // TODO: add reshaping
    }

    // Validation of model info
    await this.validateModelInfo(fileToUpload);
  }

  async uploadOnnxModel(fileToUpload: ModelFile, resource_dir: string, onlyConvert = false): Promise<void> {
    await this.importModel('ONNX', fileToUpload, resource_dir);

    await this.fillImportFormAndConvertModel(fileToUpload, resource_dir);

    if (!onlyConvert) {
      if (!fileToUpload.conversionSettings.dynamic) {
        await browser.wait(
          async () => await this.configurationWizard.isUploadReady(fileToUpload.name),
          browser.params.defaultTimeout * 4,
          'Upload is not ready'
        );
      } else {
        // Wait for the convert stage
        await this.waitForConversion();
        await this.configureLayouts(fileToUpload);
      }

      // Validation of model info
      await this.validateModelInfo(fileToUpload);
    }
  }

  async uploadTensorFlowModel(fileToUpload: ModelFile, resource_dir: string): Promise<void> {
    await this.importModel('TensorFlow', fileToUpload, resource_dir);

    await this.fillImportFormAndConvertModel(fileToUpload, resource_dir);

    // FIXME: extract this part to reuse
    if (!fileToUpload.conversionSettings.dynamic) {
      await browser.wait(
        async () => await this.configurationWizard.isUploadReady(fileToUpload.name),
        browser.params.defaultTimeout * 2,
        'Upload is not ready'
      );
    } else {
      await this.waitForConversion();
      await this.configureLayouts(fileToUpload);
    }

    // Validation of model info
    await this.validateModelInfo(fileToUpload, {
      shouldValidateSettings: !!fileToUpload.conversionSettings.inputLayers,
    });
  }

  async uploadTensorFlowV2Model(fileToUpload, resource_dir: string) {
    await this.importModel('TensorFlow V2', fileToUpload, resource_dir);

    // Convert stage
    await this.fillImportFormAndConvertModel(fileToUpload, resource_dir);

    if (!fileToUpload.conversionSettings.dynamic) {
      await browser.wait(
        async () => await this.configurationWizard.isUploadReady(fileToUpload.name),
        browser.params.defaultTimeout * 3,
        'Upload is not ready'
      );
    } else {
      // Wait for the convert stage
      await this.waitForConversion();
      // TODO: add reshaping
    }

    // Validation of model info
    // in current H5 models, the validate details set as N/A
    await this.validateModelInfo(fileToUpload, { shouldValidateTheoreticalAnalysis: !fileToUpload.h5path });
  }

  async uploadPipelineConfigFile(configPath: string, resource_dir: string) {
    await browser.wait(
      this.until.presenceOf(this.pipelineConfigFileInput),
      browser.params.defaultTimeout,
      'Pipeline Config File Input should be present'
    );
    await this.makeFileInputVisible(this.pipelineConfigFileInput);
    await browser.wait(this.until.visibilityOf(this.pipelineConfigFileInput), browser.params.defaultTimeout);
    const pipelineConfigFileAbsolutePath = path.resolve(__dirname, resource_dir, configPath);
    expect(await this.isParameterSatisfied('pipelineConfigFile-tip')).toBeFalsy(
      'Pipeline config file tip should not shows that Pipeline config file input is filled'
    );
    await this.pipelineConfigFileInput.sendKeys(pipelineConfigFileAbsolutePath);
    await browser.sleep(1000);
    expect(await this.isParameterSatisfied('pipelineConfigFile-tip')).toBeTruthy(
      'Pipeline config file tip should shows that Pipeline config file input is filled'
    );
  }

  /**
   * Returns dimensions input values
   * @param el element with wb-dimensions-input tag name
   */
  async getDimensionsInputValues(el: ElementFinder) {
    const inputElements = await el.all(by.tagName('input'));
    const values = [];
    for (const inputElement of inputElements) {
      if (inputElement instanceof ElementFinder) {
        const value = await inputElement.getAttribute('value');
        values.push(value);
      }
    }
    return values;
  }

  async checkParamsBehaviour(
    rowEl: ElementFinder,
    paramElement: ElementFinder,
    options?: {
      checkContent?: () => Promise<void>;
      shouldDisabled?: boolean;
      shouldChecked?: boolean;
      checkboxWrapper?: ElementFinder;
    }
  ) {
    const checkboxWrapper =
      options && options.checkboxWrapper ? options.checkboxWrapper : rowEl.element(by.tagName('wb-config-form-field'));
    const checkbox = checkboxWrapper.element(by.tagName('mat-checkbox'));
    const { isChecked, isDisabled } = await TestUtils.getCheckboxState(checkbox);
    if (options) {
      const { shouldChecked, shouldDisabled } = options;
      if (shouldChecked !== undefined) {
        expect(isChecked).toEqual(shouldChecked, 'Checkbox should be ' + shouldChecked ? 'checked' : 'unchecked');
      }
      if (shouldDisabled !== undefined) {
        expect(isDisabled).toEqual(shouldDisabled, 'Checkbox should be ' + shouldDisabled ? 'disabled' : 'enabled');
      }
    }
    expect(await paramElement.isPresent()).toEqual(
      isChecked,
      'Param element should ' + isChecked ? '' : 'not ' + 'be present'
    );
    if ((await paramElement.isPresent()) && options && options.checkContent) {
      await options.checkContent();
    }
    await checkbox.click();
    const { isChecked: isCheckedAfterClick } = await TestUtils.getCheckboxState(checkbox);
    if (!isDisabled) {
      expect(isCheckedAfterClick).toEqual(!isChecked, 'Checkbox should be ' + isChecked ? 'checked' : 'unchecked');
      expect(await paramElement.isPresent()).toEqual(
        !isChecked,
        'Param element should ' + isChecked ? '' : 'not ' + ' be present after uncheck checkbox'
      );
      if ((await paramElement.isPresent()) && options && options.checkContent) {
        await options.checkContent();
      }
      // return to previous state
      await checkbox.click();
      expect(await paramElement.isPresent()).toEqual(
        isChecked,
        'Param element should ' + isChecked ? '' : 'not ' + 'be present'
      );
    } else {
      expect(isCheckedAfterClick).toEqual(isChecked, 'Checkbox should be ' + isChecked ? 'checked' : 'unchecked');
      expect(await paramElement.isPresent()).toEqual(
        isChecked,
        'Param element should ' + isChecked ? '' : 'not ' + ' be present after uncheck checkbox'
      );
    }
  }

  async fillLayers(modelFile: ModelFile, edit?: boolean) {
    await this.selectIsSpecifyInputs();

    const { conversionSettings } = modelFile;
    const { colourSpace, inputLayers } = conversionSettings;
    const inputShapeForms = TestUtils.getElementsContainingDataTestIdPart('input-shape-form-');
    const inputsCount = inputLayers ? inputLayers.length : 1;
    await this.adjustLayersForm('input', inputsCount);
    for (let index = 0; index < inputsCount; index++) {
      const inputShapeForm = inputShapeForms.get(index);
      // Fill layer name
      if (inputLayers && inputLayers[index]) {
        await this.fillLayerName(index, inputLayers[index].name, 'input');
      } else {
        console.warn(`No input name for layer with index ${index}`);
      }

      // Fill input shape
      const validate = inputLayers[index].validate;
      const inputValues = inputLayers[index].shape;
      const inputType = inputLayers[index].type;
      const originalLayout: string | string[] = inputLayers[index].originalLayout;
      if (inputValues && inputValues.length) {
        const shapeRow = TestUtils.getNestedElementByDataTestId(inputShapeForm, 'shapes-row');
        const inputShapeCheckbox = TestUtils.getNestedElementContainingDataTestIdPart(inputShapeForm, 'overrideShape');
        const { isChecked: isInputShapeChecked } = await TestUtils.getCheckboxState(inputShapeCheckbox);
        if (!isInputShapeChecked) {
          await inputShapeCheckbox.click();
        }
        // because sometimes first element have index not equal 0
        const shapeInputs = TestUtils.getNestedElementsContainingDataTestIdPart(shapeRow, 'dimension-field');
        const layoutInputs = TestUtils.getNestedElementsContainingDataTestIdPart(shapeRow, 'layout-form-field');
        const shapeInputRemoveButtons = TestUtils.getNestedElementsContainingDataTestIdPart(
          shapeRow,
          'remove-dimension-'
        );
        const addButton = TestUtils.getNestedElementByDataTestId(shapeRow, 'add-dimension');
        const shapeInputsCount = await shapeInputs.count();
        const expectedInputs = Math.abs(inputValues.length - shapeInputsCount);
        const isMoreThanExpected = shapeInputsCount > inputValues.length;
        for (let i = 0; i < expectedInputs; i++) {
          const button = isMoreThanExpected ? shapeInputRemoveButtons.last() : addButton;
          console.log(
            `${isMoreThanExpected ? 'Remove extra shape input' : 'Add extra shape input'} to layer with ${index} index`
          );
          expect(await button.isPresent()).toBeTruthy(
            `${isMoreThanExpected ? 'Remove' : 'Add'} input shape button should be present in layer with ${index} index`
          );
          await button.click();
        }

        if (inputValues.length === 1 || inputValues.length === 3 || inputValues.length === 5) {
          console.log('UI has no default layout');
        } else if (inputType) {
          await TestUtils.getNestedElementByDataTestId(inputShapeForm, inputType).click();
        } else {
          // Use predefined layouts for single-input non-NLP models
          if (inputsCount === 1 && (!modelFile.domain || modelFile.domain !== modelDomainNames[ModelDomain.NLP])) {
            switch (modelFile.conversionSettings.framework) {
              case 'TensorFlow V2':
              case modelFrameworkNamesMap[ModelFrameworks.TF]:
                await browser.wait(this.until.elementToBeClickable(this.layoutTypeNHWC), 5000);
                await this.layoutTypeNHWC.click();
                break;
              default:
                await browser.wait(this.until.elementToBeClickable(this.layoutTypeNCHW), 5000);
                await this.layoutTypeNCHW.click();
            }
          }
        }
        for (let i = 0; i < inputValues.length; i++) {
          // Specify input shape
          const shapeInput = shapeInputs.get(i);
          await browser.wait(
            this.until.presenceOf(shapeInput),
            browser.params.defaultTimeout,
            `Specify Input Shape input element for config value with index ${i} at layer ${index} should be present`
          );
          const input = TestUtils.getNestedElementByDataTestId(shapeInput, 'dimension');
          if (validate) {
            await input.clear();

            // Next two commands need to display error
            await input.sendKeys('0');
            await browser.actions().sendKeys(protractor.Key.BACK_SPACE).perform();

            await browser.sleep(1000);
            const controlError = await TestUtils.getNestedElementByDataTestId(shapeInput, 'control-error');
            expect(await controlError.isPresent()).toBeTruthy();
            expect(await controlError.getText()).toEqual('This field is required');
            expect(await this.isConvertButtonDisabled()).toBeTruthy();
          }
          await input.clear();
          await input.sendKeys(inputValues[i]);

          // Specify layout for the current input if it is an NLP model OR if the model has > 1 inputs
          if (modelFile.domain === modelDomainNames[ModelDomain.NLP] || inputsCount > 1) {
            const layoutInput = layoutInputs.get(i);
            await browser.wait(
              this.until.presenceOf(layoutInput),
              browser.params.defaultTimeout,
              `Specify Layout input element for config value with index ${i} at layer ${index} should be present`
            );
            await this.selectValueFromDropdown(layoutInput, originalLayout[i]);
            if (inputType === LayoutTypeNamesByTypeMap[LayoutTypes.CUSTOM] && i === 0) {
              await this.selectInputLayerType(layoutFieldNamesValuesMap.N);
            }
          }
        }

        // Fill freeze placeholder
        const freezeValue = inputLayers[index].freezePlaceholder;
        if (freezeValue) {
          const freezeRow = TestUtils.getNestedElementByDataTestId(inputShapeForm, 'freeze-row');
          const freezeShapeCheckbox = TestUtils.getNestedElementContainingDataTestIdPart(
            freezeRow,
            'useFreezePlaceholderWithValue'
          );
          const { isChecked: isFreezeShapeChecked } = await TestUtils.getCheckboxState(freezeShapeCheckbox);
          if (!isFreezeShapeChecked) {
            await freezeShapeCheckbox.click();
          }
          const freezeInput = TestUtils.getNestedElementContainingDataTestIdPart(
            freezeRow,
            'freeze-placeholder-input-'
          );
          expect(await freezeInput.isPresent()).toBeTruthy(
            'Freeze Placeholder with Value input field should be present'
          );
          const freezeInputText = await freezeInput.getText();
          if (freezeInputText !== freezeValue) {
            await freezeInput.clear();
          }
          await freezeInput.sendKeys(freezeValue);
        }
        const meansValue = inputLayers[index].means;
        const scalesValue = inputLayers[index].scales;
        const isGrayscaleModel = colourSpace === 'Grayscale';
        // fill means
        if (meansValue) {
          await this.fillMeansScales(meansValue, 'means', inputShapeForm, isGrayscaleModel);
        }
        // Fill scales
        if (scalesValue) {
          await this.fillMeansScales(scalesValue, 'scales', inputShapeForm, isGrayscaleModel);
        }
      }
    }
    await this.checkTipExpand('inputs-tip', edit);
    await new TestUtils().checkExternalLinkDialogWindow();
    expect(this.isParameterSatisfied('inputs-tip')).toBeTruthy('Inputs should be defined');
  }

  async fillMeansScales(
    value: number[],
    type: 'means' | 'scales',
    inputShapeForm: ElementFinder,
    isGrayscaleModel: boolean
  ) {
    if (value.length) {
      const row = TestUtils.getNestedElementByDataTestId(inputShapeForm, type + '-row');
      const elementId = `use${type.charAt(0).toUpperCase()}${type.substring(1)}`;
      const rowCheckbox = TestUtils.getNestedElementContainingDataTestIdPart(row, elementId.toString());
      const { isChecked: isRowChecked } = await TestUtils.getCheckboxState(rowCheckbox);
      if (!isRowChecked) {
        await rowCheckbox.click();
      }
      const rowInputs = TestUtils.getNestedElementsContainingDataTestIdPart(row, 'input-dimension-');
      expect(await rowInputs.count()).toEqual(
        isGrayscaleModel ? 1 : 3,
        `Model should have ${isGrayscaleModel ? 'only one' : 'three'} ${type} input`
      );
      expect(value.length).toEqual(
        isGrayscaleModel ? 1 : 3,
        `Model should have ${isGrayscaleModel ? 'only one' : 'three'} values in ${type} config`
      );
      for (let i = 0; i < value.length; i++) {
        const rowInput = rowInputs.get(i);
        await rowInput.clear();
        await rowInput.sendKeys(value[i]);
      }
    }
  }

  async adjustLayersForm(type: 'input' | 'output', layersCount: number) {
    const forms = TestUtils.getElementsContainingDataTestIdPart(`${type}-shape-form-`);
    const formsCount = await forms.count();
    if (formsCount !== layersCount) {
      console.log(type + ' layer count mismatch');
      const expectedLayersCount = Math.abs(formsCount - layersCount);
      const isMoreThanExpected = formsCount > layersCount;
      console.log(isMoreThanExpected ? 'Layers in form more than in config' : 'Layers in form less than in config');
      for (let i = 0; i < expectedLayersCount; i++) {
        const button = isMoreThanExpected
          ? TestUtils.getNestedElementByDataTestId(forms.last(), 'remove-layer')
          : TestUtils.getElementByDataTestId(`add-${type}-layer`);
        console.log(`${isMoreThanExpected ? 'Remove' : 'Add'} extra ${type} layer`);
        expect(await button.isPresent()).toBeTruthy(
          `${isMoreThanExpected ? 'Remove' : 'Add'} ${type} layer button should be present`
        );
        await button.click();
      }
    }
  }

  async fillReshapeForm(modelLayers: Array<{ name; shape; layout? }>, shouldSetLayout = false) {
    const layersRows: ElementFinder[] = await TestUtils.getAllElementsByDataTestId('layer-row');
    for await (const row of layersRows) {
      const layerName: string = String(
        await TestUtils.getNestedElementByDataTestId(row, 'layer-name').getText()
      ).trim();
      const { shape, layout } = modelLayers.find(({ name }) => {
        return layerName === name;
      });

      const isCVModel = !Array.isArray(layout);

      if (shouldSetLayout) {
        if (isCVModel) {
          const layoutSelector = await TestUtils.getNestedElementByDataTestId(row, layout);
          await browser.wait(this.until.elementToBeClickable(layoutSelector), 5000);
          await layoutSelector.click();
          console.log(`Selected ${layout} layout.`);
          continue;
        }
      }
      const inputsContainer = await TestUtils.getNestedElementByDataTestId(row, 'dimensions-input');
      const inputs = await TestUtils.getAllNestedElementsByDataTestId(inputsContainer, 'dimension');
      const layoutInputs: ElementFinder[] = await TestUtils.getAllNestedElementsByDataTestId(row, 'layout-form-field');
      for await (const [index, input] of inputs.entries()) {
        if (shape[index] === -1) {
          continue;
        }
        await input.clear();
        await input.sendKeys(shape[index]);
        await browser.sleep(500);

        // Set layouts if an NLP model
        if (!isCVModel) {
          await this.selectValueFromDropdown(layoutInputs[index], layout[index]);
        }
      }
    }
  }

  async configureLayouts(fileToUpload: ModelFile, shouldFillReshapeForm = true, shouldSetLayout = false) {
    const layers = fileToUpload.conversionSettings.inputLayers.map((el) => {
      return { name: el.name, shape: el.shape, layout: el.originalLayout };
    });

    if (shouldFillReshapeForm || shouldSetLayout) {
      if (shouldFillReshapeForm) {
        expect(await this.isValidateButtonDisabled()).toBeTruthy();
      }
      await this.fillReshapeForm(layers, shouldSetLayout);
    }
    expect(await this.isValidateButtonDisabled()).toBeFalsy();

    const validateBtn = await this.validateButton;
    await browser.wait(this.until.elementToBeClickable(validateBtn), 5000);
    await validateBtn.click();
  }

  async checkConfigureLayouts(fileToUpload: ModelFile) {
    const layers = fileToUpload.conversionSettings['incorrectLayers'].map((el: { name; shape }) => {
      return { name: el.name, shape: el.shape };
    });

    expect(await this.isValidateButtonDisabled()).toBeTruthy();
    await this.fillReshapeForm(layers);
    if (fileToUpload.conversionSettings['incorrectInputs'] || fileToUpload.conversionSettings['incorrectLayout']) {
      expect(await this.isValidateButtonDisabled()).toBeTruthy();
      return;
    }

    const validateBtn = await this.validateButton;
    await browser.wait(this.until.elementToBeClickable(validateBtn), 5000);
    await validateBtn.click();
    await this.configurationWizard.checkErrorMessageBox(await this.reshapeErrorBox);
  }
}
