import { browser, by, element, ElementArrayFinder, ElementFinder, protractor } from 'protractor';

import { ModelColorChannels, TransformationsConfigType } from '@store/model-store/model.model';

import { TestUtils } from './pages/test-utils';
import { Helpers } from './pages/helpers';
import { OMZModelPrecisionEnum } from '../../src/app/modules/model-manager/components/model-downloader-table/model-downloader-table.component';
import { isMXNetModel, isTensorFlowModel, ModelFile } from './pages/model-file';

describe('UI tests for model import form', () => {
  const testUtils = new TestUtils();
  const helpers = new Helpers();
  const until = protractor.ExpectedConditions;
  const { resources, resource_dir } = browser.params.precommit_scope;

  const checkFreezePlaceholderInput = async (
    field: ElementFinder,
    testValues: { value: string | undefined; expectedState: 'valid' | 'invalid' }[]
  ): Promise<void> => {
    await TestUtils.checkMatFormFieldState(field, 'valid', 'freeze-row');
    const input = field.element(by.tagName('input'));
    for (let i = 0; i < testValues.length; i++) {
      const { value, expectedState } = testValues[i];
      await TestUtils.clearInput(input);
      if (!value) {
        await TestUtils.checkMatFormFieldState(field, expectedState, 'freeze-row');
      } else {
        await input.sendKeys(value);
        await TestUtils.checkMatFormFieldState(field, expectedState, 'freeze-row');
      }
    }
  };

  const checkDimensionsInput = async (
    dimensionsInput: ElementFinder,
    expectedInputsCount: number,
    rowId: 'shapes-row' | 'means-row' | 'scales-row'
  ): Promise<void> => {
    const fieldsArray =
      rowId !== 'shapes-row'
        ? dimensionsInput.all(by.tagName('mat-form-field'))
        : TestUtils.getAllNestedElementsByDataTestId(dimensionsInput, 'dimension-form-field');
    expect(await fieldsArray.count()).toEqual(expectedInputsCount, `form should contain ${expectedInputsCount} input`);
    const fields = await fieldsArray;
    for (const fieldElement of fields) {
      if (fieldElement instanceof ElementFinder) {
        let fieldName;
        if (rowId) {
          const index = fields.indexOf(fieldElement);
          fieldName = `${rowId} ${index}`;
        }
        const input = fieldElement.element(by.tagName('input'));
        let inputValue = await input.getAttribute('value');
        if (!(rowId === 'shapes-row' && inputValue === '-1')) {
          await TestUtils.checkMatFormFieldState(fieldElement, 'valid', fieldName);
        }
        await TestUtils.clearInput(input);
        await input.sendKeys('String');
        inputValue = await input.getAttribute('value');
        // In Chrome 91.0.4472.101 getAttribute('value') always equal to null
        if (inputValue !== null) {
          expect(inputValue).toEqual('', 'Input should accept only numbers');
        }
        await TestUtils.clearInput(input);
        await input.sendKeys(Helpers.getRandomInRange(1, 2048));
        await TestUtils.checkMatFormFieldState(fieldElement, 'valid', fieldName);
        await TestUtils.clearInput(input);
        await TestUtils.checkMatFormFieldState(fieldElement, 'invalid', fieldName);
      }
    }
  };

  const checkShape = async (dimensionsInput: ElementFinder): Promise<void> => {
    const fieldsArray = TestUtils.getAllNestedElementsByDataTestId(dimensionsInput, 'dimension');
    const removeButtonArray = TestUtils.getNestedElementsContainingDataTestIdPart(dimensionsInput, 'remove-dimension-');
    const addButton = await TestUtils.getNestedElementByDataTestId(dimensionsInput, 'add-dimension');
    let fieldsCount = 0;

    if ((await fieldsArray.count()) < 5) {
      expect(await addButton.isPresent()).toBeTruthy('Add button should be present if less than 5 inputs in form');
    }
    if ((await fieldsArray.count()) > 1) {
      fieldsCount = await fieldsArray.count();
      expect(await removeButtonArray.count()).toEqual(
        fieldsCount,
        'Remove buttons count should be equal inputs count if more than one input exist'
      );
    } else {
      expect(await removeButtonArray.count()).toEqual(0, 'Remove buttons count should not displayed');
    }
    fieldsCount = await fieldsArray.count();
    for (let i = 1; i < fieldsCount; i++) {
      await removeButtonArray.first().click();
    }
    expect(await removeButtonArray.count()).toEqual(0, 'Remove buttons count should not displayed');
    expect(await addButton.isPresent()).toBeTruthy('Add button should be present if less than 5 inputs in form');
    for (let i = 1; i < 5; i++) {
      await addButton.click();
    }
    fieldsCount = await fieldsArray.count();
    expect(await addButton.isPresent()).toBeFalsy('Add button should not be present');
    expect(await removeButtonArray.count()).toEqual(5, 'Five Remove buttons count should be displayed');
    expect(await removeButtonArray.count()).toEqual(
      fieldsCount,
      'Remove buttons count should be equal inputs count if more than one input exist'
    );
    await checkDimensionsInput(dimensionsInput, 5, 'shapes-row');
  };

  const checkDropDownAndSetValue = async (
    el: ElementFinder,
    value: string,
    expectedValues: string[]
  ): Promise<void> => {
    await testUtils.checkDropDownState(el);
    await testUtils.checkDropDownValues(el, expectedValues);
    await testUtils.modelManagerPage.selectValueFromDropdown(el, value);
    await testUtils.checkDropDownValidationState(el, 'valid');
  };

  const checkInputLayer = async (layer: ElementFinder, isGrayScale: boolean): Promise<void> => {
    const meansScalesInputCount = isGrayScale ? 1 : 3;
    console.log('Checking name');
    const layerNameRow = TestUtils.getNestedElementByDataTestId(layer, 'name-row');
    const autocomplete = layerNameRow.element(by.tagName('wb-select-autocomplete'));
    const randomName = helpers.generateName();
    await testUtils.checkAutocomplete(autocomplete, {
      randomName,
      elementName: 'Layer name',
      shouldContainOptions: true,
    });
    console.log('Checking shape');
    const shapeRow = await TestUtils.getNestedElementByDataTestId(layer, 'shapes-row');
    const shapeCheckbox = await TestUtils.getNestedElementByDataTestId(layer, 'overrideShape');
    const { isChecked } = await TestUtils.getCheckboxState(shapeCheckbox);
    if (!isChecked) {
      await shapeCheckbox.click();
    }
    const shapeRowInputs = await TestUtils.getNestedElementByDataTestId(shapeRow, 'dimensions-input');
    await checkShape(shapeRowInputs);
    console.log('Checking freeze placeholder');
    const freezeRow = TestUtils.getNestedElementByDataTestId(layer, 'freeze-row');
    const freezeRowInput = freezeRow.element(by.tagName('mat-form-field'));

    const expectedFreezeValues: { value: string; expectedState: 'valid' | 'invalid' }[] = [
      { value: helpers.generateName(), expectedState: 'invalid' },
      { value: 'True', expectedState: 'valid' },
      { value: '[[3] [224 224]]', expectedState: 'valid' },
      { value: undefined, expectedState: 'invalid' },
    ];
    await testUtils.modelManagerPage.checkParamsBehaviour(freezeRow, freezeRowInput, {
      checkContent: () => checkFreezePlaceholderInput(freezeRowInput, expectedFreezeValues),
      shouldDisabled: false,
    });
    console.log('Checking means');
    const meansRow = TestUtils.getNestedElementByDataTestId(layer, 'means-row');
    const meansRowInputs = meansRow.element(by.tagName('wb-dimensions-input'));
    await testUtils.modelManagerPage.checkParamsBehaviour(meansRow, meansRowInputs, {
      checkContent: () => checkDimensionsInput(meansRowInputs, meansScalesInputCount, 'means-row'),
      shouldDisabled: false,
    });
    console.log('Checking scales');
    const scalesRow = TestUtils.getNestedElementByDataTestId(layer, 'scales-row');
    const scalesRowInputs = scalesRow.element(by.tagName('wb-dimensions-input'));
    await testUtils.modelManagerPage.checkParamsBehaviour(scalesRow, scalesRowInputs, {
      checkContent: () => checkDimensionsInput(scalesRowInputs, meansScalesInputCount, 'scales-row'),
      shouldDisabled: false,
    });
  };

  const checkRemoveButtons = async (layersContainer: ElementFinder): Promise<void> => {
    const layers = TestUtils.getNestedElementsContainingDataTestIdPart(layersContainer, 'input-shape-form-');
    const layersCount = await layers.count();
    if (layersCount > 1) {
      const removeButtonCount = await TestUtils.getAllNestedElementsByDataTestId(
        layersContainer,
        'remove-layer'
      ).count();
      expect(removeButtonCount).toEqual(layersCount, 'Remove buttons count should not be equal ' + layersCount);
    } else {
      const isRemoveButtonPresent = await TestUtils.getAllNestedElementsByDataTestId(
        layers.first(),
        'remove-layer'
      ).isPresent();
      expect(isRemoveButtonPresent).toBeFalsy('Remove button should not be present on single layer');
    }
  };

  const checkOutputNames = async (outputLayers: ElementArrayFinder): Promise<void> => {
    const outputLayersArray = await outputLayers;
    for (const layerElement of outputLayersArray) {
      if (layerElement instanceof ElementFinder) {
        const index = outputLayersArray.indexOf(layerElement);
        const layerNameInput = layerElement.element(by.tagName('wb-select-autocomplete'));
        await testUtils.checkAutocomplete(layerNameInput, {
          randomName: helpers.generateName(),
          elementName: 'Output name-' + index,
        });
      }
    }
  };

  const checkLayersBehavior = async (
    layersContainer: ElementFinder,
    type: 'input' | 'output',
    checkLayer?: () => Promise<void>
  ) => {
    const addLayerButton = TestUtils.getElementByDataTestId(`add-${type}-layer`);
    const layers = TestUtils.getNestedElementsContainingDataTestIdPart(layersContainer, `${type}-shape-form-`);
    const layersCount = await layers.count();
    await checkRemoveButtons(layersContainer);
    await browser.sleep(10000);
    await addLayerButton.click();
    await browser.sleep(1000);
    const updatedLayers = await layers.count();
    expect(updatedLayers).toEqual(layersCount + 1, 'Number of layers should increase by one');
    await checkRemoveButtons(layersContainer);
    const lastLayer = layers.last();
    if (checkLayer) {
      await checkLayer();
    }
    const removeButton = TestUtils.getAllNestedElementsByDataTestId(lastLayer, 'remove-layer').first();
    await removeButton.click();
    expect(await layers.count()).toEqual(layersCount, 'Number of layers should be equal ' + layersCount);
    await checkRemoveButtons(layersContainer);
  };

  const checkImportForm = async (modelFile): Promise<void> => {
    const { conversionSettings } = modelFile;
    await testUtils.modelManagerPage.importModel(conversionSettings.framework, modelFile, resource_dir);
    console.log('check precision drop down');
    await browser.wait(
      testUtils.modelManagerPage.until.elementToBeClickable(testUtils.modelManagerPage.precisionContainer),
      browser.params.defaultTimeout
    );
    await checkDropDownAndSetValue(testUtils.modelManagerPage.precisionContainer, conversionSettings.precision, [
      OMZModelPrecisionEnum.FP32,
      OMZModelPrecisionEnum.FP16,
    ]);
    expect(await testUtils.modelManagerPage.isParameterSatisfied('dataType-tip')).toBeTruthy(
      'Precision tip should shows that precision drop down is filled'
    );
    await testUtils.modelManagerPage.checkTipExpand('dataType-tip');
    console.log('check Color Space drop down');
    expect(await testUtils.modelManagerPage.isParameterSatisfied('originalChannelsOrder-tip')).toBeFalsy(
      'Color Space tip should not shows that Color Space drop down is filled'
    );
    await testUtils.modelManagerPage.checkTipExpand('originalChannelsOrder-tip');
    await checkDropDownAndSetValue(testUtils.modelManagerPage.colourSpaceContainer, conversionSettings.colourSpace, [
      ModelColorChannels.RGB,
      ModelColorChannels.BGR,
      ModelColorChannels.Grayscale,
    ]);
    expect(await testUtils.modelManagerPage.isParameterSatisfied('originalChannelsOrder-tip')).toBeTruthy(
      'Color Space tip should shows that Color Space drop down is filled'
    );
    if (conversionSettings.framework === 'MxNet') {
      const checkMxNetCheckbox = async (checkbox: ElementFinder, name: string) => {
        console.log(`Checking ${name} checkbox`);
        expect(await checkbox.isPresent()).toBeTruthy(name + ' checkbox should be present for MxNet model');
        const { isDisabled: checkboxDisabled } = await TestUtils.getCheckboxState(checkbox);
        expect(checkboxDisabled).toBeFalsy(name + ' checkbox should not be disabled');
      };
      await checkMxNetCheckbox(testUtils.modelManagerPage.isLegacy, 'Legacy MXNet Model');
      await checkMxNetCheckbox(testUtils.modelManagerPage.enableSSDGluoncvCheckBox, 'Enable SSD GluonCV');
      if (conversionSettings.legacy) {
        await testUtils.modelManagerPage.isLegacy.click();
        const { isChecked: isLegacyChecked } = await TestUtils.getCheckboxState(testUtils.modelManagerPage.isLegacy);
        expect(isLegacyChecked).toBeTruthy('Legacy MXNet Model checkbox should be checked');
      }
      if (conversionSettings.gluoncv) {
        await testUtils.modelManagerPage.enableSSDGluoncvCheckBox.click();
        const { isChecked: isGluonCVChecked } = await TestUtils.getCheckboxState(
          testUtils.modelManagerPage.enableSSDGluoncvCheckBox
        );
        expect(isGluonCVChecked).toBeTruthy('Enable SSD GluonCV checkbox should be checked');
      }
    }
    if (conversionSettings.ODAPI) {
      await testUtils.modelManagerPage.uploadPipelineConfigFile(modelFile.configPath, resource_dir);
      await testUtils.modelManagerPage.checkTipExpand('pipelineConfigFile-tip');
      await testUtils.modelManagerPage.checkTipExpand('predefinedTransformationsConfig-tip');
    }
    console.log('Check model conversion configuration file');
    const configCheckbox = testUtils.modelManagerPage.useTransformationsConfig;
    const conversionConfigForm = element(by.id('transformationsConfigType'));
    const { isChecked, isDisabled } = await TestUtils.getCheckboxState(configCheckbox);
    if (conversionSettings.modelTransformationsConfig !== undefined) {
      expect(isChecked).toBeTruthy('Use model conversion configuration file checkbox should be checked');
      expect(isDisabled).toBeTruthy('Use model conversion configuration file checkbox should be disabled');
    } else {
      expect(isChecked).toBeFalsy('Use model conversion configuration file checkbox should not be checked');
      expect(isDisabled).toBeFalsy('Use model conversion configuration file checkbox should not be disabled');
      expect(await conversionConfigForm.isPresent()).toBeFalsy(
        'conversion configuration radio buttons should not be present'
      );
      await configCheckbox.click();
    }
    const { isChecked: isCheckedAfterClick } = await TestUtils.getCheckboxState(configCheckbox);
    expect(isCheckedAfterClick).toBeTruthy('Use model conversion configuration file checkbox should be checked');
    expect(await conversionConfigForm.isPresent()).toBeTruthy(
      'conversion configuration radio buttons should be present'
    );
    const preConfiguredRadio = await testUtils.modelManagerPage.getTransformationsConfigTypeElement(
      TransformationsConfigType.PRECONFIGURED
    );
    const customRadio = await testUtils.modelManagerPage.getTransformationsConfigTypeElement(
      TransformationsConfigType.CUSTOM
    );
    const isPreConfiguredRadioDisabled = await testUtils.isRadioDisabled(preConfiguredRadio);
    const isCustomRadioDisabled = await testUtils.isRadioDisabled(customRadio);
    if (conversionSettings.framework === 'Caffe') {
      expect(await isPreConfiguredRadioDisabled).toBeTruthy('Pre Configured Radio button should be disabled');
      expect(await isCustomRadioDisabled).toBeTruthy('Custom Config Radio button should be disabled');
      expect(await testUtils.isRadioButtonSelected(preConfiguredRadio)).toBeFalsy(
        'Pre Configured Radio button should not be selected'
      );
      expect(await testUtils.isRadioButtonSelected(customRadio)).toBeTruthy(
        'Custom Config Radio button should be selected'
      );
    } else {
      await customRadio.click();
      expect(await testUtils.modelManagerPage.transformationsConfigFileInput.isPresent()).toBeTruthy(
        'Custom config input should be present'
      );
      expect(await TestUtils.getElementByDataTestId('predefinedTransformationsConfig').isPresent()).toBeFalsy(
        'Table with transformation config should not be present'
      );
      await preConfiguredRadio.click();
      expect(await testUtils.modelManagerPage.transformationsConfigFileInput.isPresent()).toBeFalsy(
        'Custom config input should not be present'
      );
      expect(await TestUtils.getElementByDataTestId('predefinedTransformationsConfig').isPresent()).toBeTruthy(
        'Table with transformation config should be present'
      );
    }
    if (
      conversionSettings.modelTransformationsConfig === undefined &&
      conversionSettings.transformationsConfigPath === undefined
    ) {
      await configCheckbox.click();
      expect(await conversionConfigForm.isPresent()).toBeFalsy(
        'conversion configuration radio buttons should not be present'
      );
    }
    if (conversionSettings.modelTransformationsConfig) {
      console.log('Checking config existence in table and selecting it');
      await preConfiguredRadio.click();
      console.log('Choosing config from table');
      await testUtils.modelManagerPage.selectPredefinedTransformationsConfig(
        conversionSettings.modelTransformationsConfig
      );
    }
    if (conversionSettings.transformationsConfigPath) {
      console.log('Uploading custom transformation config');
      await testUtils.modelManagerPage.selectAndUploadCustomTransformationsConfig(
        conversionSettings.transformationsConfigPath
      );
    }
    console.log('Checking input layers');
    await testUtils.modelManagerPage.selectIsSpecifyInputs();

    const selectedColorSpace = await testUtils.modelManagerPage.colourSpaceContainer.getText();
    const layersContainer = element(by.className('input-shape-container-content'));
    const layers = TestUtils.getElementsContainingDataTestIdPart('input-shape-form-');
    const lastLayer = layers.last();
    await checkLayersBehavior(layersContainer, 'input', () =>
      checkInputLayer(lastLayer, selectedColorSpace === ModelColorChannels.Grayscale)
    );
    for (const layerElement of await layers) {
      await checkInputLayer(layerElement, selectedColorSpace === ModelColorChannels.Grayscale);
    }
    console.log('Checking output layers');
    await TestUtils.getElementByDataTestId('useOutputs').click();
    const overrideOutputsContainer = TestUtils.getElementByDataTestId('advanced-parameters');
    const outputsContainer = TestUtils.getNestedElementByDataTestId(overrideOutputsContainer, 'output-list');
    const outputLayers = TestUtils.getElementsContainingDataTestIdPart('output-shape-form-');
    await testUtils.modelManagerPage.checkParamsBehaviour(overrideOutputsContainer, outputsContainer, {
      checkContent: () => checkLayersBehavior(outputsContainer, 'output', () => checkOutputNames(outputLayers)),
      checkboxWrapper: TestUtils.getElementByDataTestId('overrideOutputs'),
    });
    await TestUtils.getElementByDataTestId('useOutputs').click();
  };

  const convertModel = async (model, edit?: boolean): Promise<void> => {
    await testUtils.modelManagerPage.fillLayers(model, edit);
    await browser.sleep(15000);
    await testUtils.modelManagerPage.fillOutputLayers(model.conversionSettings.outputs);
    if (model.conversionSettings.transformationsConfigPath) {
      const { isChecked } = await TestUtils.getCheckboxState(testUtils.modelManagerPage.useTransformationsConfig);
      if (!isChecked) {
        await testUtils.modelManagerPage.useTransformationsConfig.click();
      }
      await browser.sleep(500);
      await testUtils.modelManagerPage.selectAndUploadCustomTransformationsConfig(
        model.conversionSettings.transformationsConfigPath
      );
      expect(await testUtils.modelManagerPage.isParameterSatisfied('customTransformationsConfig-tip')).toBeTruthy(
        'Transformations config is filled, tip should be green.'
      );
    }

    if (model.conversionSettings.preConfiguredConfigurationFile) {
      await testUtils.modelManagerPage.selectPreConfiguredConfigurationFile(
        model.conversionSettings.preConfiguredConfigurationFile
      );
    }

    await browser.wait(
      until.elementToBeClickable(testUtils.modelManagerPage.convertButton),
      5000,
      'Convert button is not clickable'
    );
    await testUtils.modelManagerPage.clickConvertButton();
  };

  const getInputValues = async (inputs: ElementArrayFinder) => {
    const inputsCount = await inputs.count();
    if (inputsCount === 0) {
      return null;
    }
    const values = [];
    for (let i = 0; i < inputsCount; i++) {
      const input = inputs.get(i);
      const value = await input.getAttribute('value');
      values.push(value);
    }
    if (inputsCount === 1) {
      return values[0];
    }
    return values;
  };

  const getLayerRowParams = async (parentEl: ElementFinder, rowId: string, testIdPart: string) => {
    const row = TestUtils.getNestedElementByDataTestId(parentEl, rowId);
    return rowId === 'shapes-row'
      ? await getInputValues(TestUtils.getNestedElementsContainingDataTestIdPart(row, testIdPart))
      : await getInputValues(TestUtils.getAllNestedElementsByDataTestId(row, testIdPart));
  };

  const getExpectedInputDimensionValue = (expectedValue: number[] | undefined): string | string[] => {
    if (!expectedValue) {
      return null;
    }
    if (expectedValue.length === 1) {
      return expectedValue[0].toString(10);
    }
    if (expectedValue.length > 1) {
      return expectedValue.map((value) => value.toString(10));
    }
  };

  const compareParams = async (modelConfig: ModelFile) => {
    const precision = await testUtils.modelManagerPage.precisionContainer.getText();
    expect(precision).toEqual(
      modelConfig.conversionSettings.precision,
      `Precision should be equal ${modelConfig.conversionSettings.precision}, but got ${precision}`
    );
    const colorSpace = await testUtils.modelManagerPage.colourSpaceContainer.getText();
    expect(colorSpace).toEqual(
      modelConfig.conversionSettings.colourSpace,
      `Color space should be equal ${modelConfig.conversionSettings.colourSpace}, but got ${colorSpace}`
    );

    if (isTensorFlowModel(modelConfig)) {
      if (modelConfig.conversionSettings.ODAPI) {
        const { isChecked } = await TestUtils.getCheckboxState(testUtils.modelManagerPage.usePipelineConfig);
        expect(isChecked).toBeTruthy('Use pipeline config checkbox should be checked');
        const pipelineInput = testUtils.modelManagerPage.pipelineConfigFileInput;
        expect(await pipelineInput.isPresent()).toBeTruthy('Pipeline config input should be checked');
        const parent = pipelineInput.element(by.xpath('..'));
        const fileName = await parent.element(by.className('file-upload-field-selected')).getText();
        const isConfigSelected = fileName !== 'No Selected File';
        expect(isConfigSelected).toBeTruthy('Pipeline config file should be selected');
      }
      if (modelConfig.conversionSettings.modelTransformationsConfig) {
        const { isChecked } = await TestUtils.getCheckboxState(testUtils.modelManagerPage.useTransformationsConfig);
        expect(isChecked).toBeTruthy('Use model conversion configuration file checkbox should be checked');
        const isSelected = await testUtils.isRadioButtonSelected(
          testUtils.modelManagerPage.getTransformationsConfigTypeElement(TransformationsConfigType.PRECONFIGURED)
        );
        expect(isSelected).toBeTruthy('Predefined Configuration File radio should be selected');
        const configTable = element(by.tagName('wb-transformations-config-field'));
        expect(await configTable.isPresent()).toBeTruthy('Configuration table should be present');
        if (await configTable.isPresent()) {
          const configTableCol = await TestUtils.getElementByDataTestId(
            `transformations-config-${modelConfig.conversionSettings.modelTransformationsConfig}`
          );
          const row: ElementFinder = configTableCol.element(by.xpath('..'));
          const rowClasses = await row.getAttribute('class');
          const isConfigRowSelected = rowClasses.includes('selected');
          expect(isConfigRowSelected).toBeTruthy('Config in table should be selected');
        }
      }
      if (modelConfig.conversionSettings.transformationsConfigPath) {
        const { isChecked } = await TestUtils.getCheckboxState(testUtils.modelManagerPage.useTransformationsConfig);
        expect(isChecked).toBeTruthy('Use model conversion configuration file checkbox should be checked');
        const isSelected = await testUtils.isRadioButtonSelected(
          testUtils.modelManagerPage.getTransformationsConfigTypeElement(TransformationsConfigType.CUSTOM)
        );
        expect(isSelected).toBeTruthy('Custom Configuration File radio should be selected');
        const fileInput = testUtils.modelManagerPage.transformationsConfigFileInput;
        expect(await fileInput.isPresent()).toBeTruthy('Custom Configuration input should be present');
        if (await fileInput.isPresent()) {
          const parent = fileInput.element(by.xpath('..'));
          const fileName = await parent.element(by.className('file-upload-field-selected')).getText();
          const isConfigSelected = fileName !== 'No Selected File';
          expect(isConfigSelected).toBeTruthy('Custom Configuration file should be selected');
        }
      }
    }
    if (isTensorFlowModel(modelConfig) || isMXNetModel(modelConfig)) {
      if (modelConfig.conversionSettings.preConfiguredConfigurationFile) {
        const configTableCol = await TestUtils.getElementByDataTestId(
          `transformations-config-${modelConfig.conversionSettings.preConfiguredConfigurationFile}`
        );
        const row: ElementFinder = configTableCol.element(by.xpath('..'));
        const rowClasses = await row.getAttribute('class');
        const isConfigRowSelected = rowClasses.includes('selected');
        expect(isConfigRowSelected).toBeTruthy('Config in table should be selected');
      }
    }
    if (isMXNetModel(modelConfig)) {
      const { isChecked: isLegacyChecked } = await TestUtils.getCheckboxState(testUtils.modelManagerPage.isLegacy);
      expect(isLegacyChecked).toEqual(
        modelConfig.conversionSettings.legacy,
        `Legacy checkbox should be ${modelConfig.conversionSettings.legacy ? 'checked' : 'unchecked'}`
      );
      const { isChecked: isGluonCVChecked } = await TestUtils.getCheckboxState(
        testUtils.modelManagerPage.enableSSDGluoncvCheckBox
      );
      expect(isGluonCVChecked).toEqual(
        modelConfig.conversionSettings.gluoncv,
        `Enable SSD GluonCV checkbox should be ${modelConfig.conversionSettings.gluoncv ? 'checked' : 'unchecked'}`
      );
    }
    await testUtils.modelManagerPage.selectIsSpecifyInputs();
    const inputShapeForms = TestUtils.getElementsContainingDataTestIdPart('input-shape-form-');

    const inputsCount = await inputShapeForms.count();
    for (let index = 0; index < inputsCount; index++) {
      const inputShapeForm = inputShapeForms.get(index);
      const rows = [
        { rowId: 'name-row', testIdPart: `input-layer-name-${index}` },
        { rowId: 'shapes-row', testIdPart: 'dimension' },
        { rowId: 'means-row', testIdPart: 'input-dimension-' },
        { rowId: 'scales-row', testIdPart: 'input-dimension-' },
        { rowId: 'freeze-row', testIdPart: 'freeze-placeholder-input-' },
      ];

      for (const row of rows) {
        const value = await getLayerRowParams(inputShapeForm, row.rowId, row.testIdPart);
        let expectedValue;
        if (row.rowId === 'name-row') {
          expectedValue = modelConfig.conversionSettings.inputLayers[index].name;
        }
        if (row.rowId === 'shapes-row') {
          const inputShapes = [];

          for (const inputLayerInfo of modelConfig.conversionSettings.inputLayers) {
            inputShapes.push(inputLayerInfo.shape);
          }
          const inputShapeValue = inputShapes[index];
          expectedValue = getExpectedInputDimensionValue(inputShapeValue);
        }
        if (row.rowId === 'freeze-row') {
          const shouldFreezePlaceholders = [];

          for (const inputLayerInfo of modelConfig.conversionSettings.inputLayers) {
            shouldFreezePlaceholders.push(inputLayerInfo.freezePlaceholder);
          }
          expectedValue = shouldFreezePlaceholders[index];
        }
        if (index === 0) {
          const { means, scales } = modelConfig.conversionSettings.inputLayers[0];

          if (row.rowId === 'means-row') {
            expectedValue = getExpectedInputDimensionValue(means);
          }

          if (row.rowId === 'scales-row') {
            expectedValue = getExpectedInputDimensionValue(scales);
          }
        }
        // expect(value).toEqual(
        //   expectedValue || null,
        //   `${row.rowId} value should be equal ${expectedValue} but got ${value}`
        // );
      }
    }
    const { outputs } = modelConfig.conversionSettings;
    if (outputs) {
      const outputShapeForms = element.all(by.css(`[${TestUtils.dataTestIdPrefix}*="output-shape-form-"]`));
      const outputCount = await outputShapeForms.count();
      expect(outputs.length).toEqual(outputCount, 'Output layers count should be equal');
      if (outputs.length === outputCount) {
        for (let index = 0; index < outputCount; index++) {
          const outputShapeForm = outputShapeForms.get(index);
          const value = await getLayerRowParams(outputShapeForm, 'name-row', `output-layer-name-${index}`);
          const expectedValue = outputs[index];
          expect(value).toEqual(
            expectedValue || null,
            `Output layer name should be equal ${expectedValue} but got ${value}`
          );
        }
      }
    }
  };

  const checkModelImportForm = async (model: ModelFile, wrongModelConfig: ModelFile) => {
    model.name = helpers.generateName();
    testUtils.uploadedModels.push(model.name);
    await checkImportForm(model);
    await convertModel(wrongModelConfig);

    const errorBox = await TestUtils.getElementByDataTestId('message-box-error');
    console.log('Wait for error icon');
    await browser.wait(
      until.presenceOf(errorBox),
      browser.params.defaultTimeout * 5,
      `Error icon is not present for ${model.name} model`
    );

    expect(await testUtils.configurationWizard.isNotificationAvailable()).toBeTruthy('Notification is not available');
    await testUtils.configurationWizard.closeAllNotifications();

    await browser.sleep(1000);
    console.log('Compare params in form after fail with params in resources.json');
    await compareParams(wrongModelConfig);
    console.log('Convert model after compare params');
    await convertModel(model, true);
    console.log('Waiting for model upload');
    const modelsTable = await testUtils.configurationWizard.modelsTable;
    await browser.wait(until.presenceOf(modelsTable), browser.params.defaultTimeout * 2);
    await testUtils.modelManagerPage.isUploadReady();
  };

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
    await testUtils.modelManagerPage.selectUploadModelTab();
  });

  it('Should check fasterRCNNResNet101 Caffe model import form', async () => {
    const model = resources.classificationModels.fasterRCNNResNet101;
    const wrongModelConfig: ModelFile = {
      ...model,
      conversionSettings: {
        ...model.conversionSettings,
        inputLayers: [
          { name: 'data', shape: [1, 200, 227, 227], originalLayout: ['Batch', 'Channels', 'Height', 'Width'] },
          { name: 'im_info', shape: [1, 3], originalLayout: ['Batch', 'Channels'] },
        ],
      },
    };
    await checkModelImportForm(model, wrongModelConfig);
  });
  it('Should check Resnet152 MxNet model import form', async () => {
    const model = resources.classificationModels.Resnet152;
    const wrongModelConfig: ModelFile = {
      ...model,
      conversionSettings: { ...model.conversionSettings, inputLayers: [{ name: 'data', shape: [1, 3, 0, 227] }] },
    };
    await checkModelImportForm(model, wrongModelConfig);
  });

  // TODO: unskip after 59925
  xit('Should check ResNetGray ONNX model import form', async () => {
    const model = resources.textRecognition.ResNetGray;
    const wrongModelConfig: ModelFile = {
      ...model,
      conversionSettings: {
        ...model.conversionSettings,
        inputLayers: [{ name: 'input.0', shape: [0, 3, 227, 227], scales: [255] }],
      },
    };
    await checkModelImportForm(model, wrongModelConfig);
  });

  // TODO: unskip after 59925
  xit('Should check facenetTf TensorFlow model import form', async () => {
    const model = resources.faceRecognition.facenetTf;
    const wrongModelConfig: ModelFile = {
      ...model,
      conversionSettings: {
        ...model.conversionSettings,
        inputLayers: [
          { name: 'batch_join:0', shape: [0, 3, 227, 227] },
          { name: 'batch_join:1', shape: [1, 160, 160, 3] },
          { name: 'phase_train', shape: [1], freezePlaceholder: 'False' },
        ],
      },
    };
    await checkModelImportForm(model, wrongModelConfig);
  });

  // TODO: unskip after 59925
  xit('Should check SimpleH5TF2 TensorFlow V2 model import form', async () => {
    const model = resources.ODModels.SimpleH5TF2;
    const wrongModelConfig: ModelFile = {
      ...model,
      conversionSettings: {
        ...model.conversionSettings,
        inputLayers: [{ name: 'conv2d_input', shape: [0, 3, 227, 227] }],
      },
    };
    await checkModelImportForm(model, wrongModelConfig);
  });
  // TODO: unskip after 57386
  xit('Should check rcnnInceptionV2Coco TensorFlow model import form', async () => {
    const model = resources.ODModels.rcnnInceptionV2Coco;
    const wrongModelConfig: ModelFile = {
      ...model,
      conversionSettings: { ...model.conversionSettings, inputLayers: [{ name: 'image_tensor', shape: [0, 0, 0, 0] }] },
    };
    await checkModelImportForm(model, wrongModelConfig);
  });

  it('Should upload dynamic model with incorrect values', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.squeezenetDynamicShapes;
    modelFile.name = helpers.generateName();
    testUtils.uploadedModels.push(modelFile.name);

    const wrongModelConfig: ModelFile = {
      ...modelFile,
      conversionSettings: {
        ...modelFile.conversionSettings,
        incorrectLayers: [{ name: 'data', shape: [-1, 3, 200, 200] }],
        incorrectInputs: true,
      },
    };
    const { conversionSettings } = modelFile;
    await testUtils.modelManagerPage.importModel(conversionSettings.framework, wrongModelConfig, resource_dir);
  });

  it('Should upload dynamic model with incorrect values and check error', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.squeezenetDynamicShapes;
    modelFile.name = helpers.generateName();
    testUtils.uploadedModels.push(modelFile.name);

    const wrongModelConfig: ModelFile = {
      ...modelFile,
      conversionSettings: {
        ...modelFile.conversionSettings,
        incorrectLayers: [{ name: 'data', shape: [0, 3, 200, 200] }],
        incorrectLayout: true,
      },
    };
    const { conversionSettings } = modelFile;
    await testUtils.modelManagerPage.importModel(conversionSettings.framework, wrongModelConfig, resource_dir);
  });

  it('Upload model with incorrect layer, check error, send right layer', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.mobilenet;
    modelFile.name = helpers.generateName();
    testUtils.uploadedModels.push(modelFile.name);

    const wrongModelConfig: ModelFile = {
      ...modelFile,
      conversionSettings: {
        ...modelFile.conversionSettings,
        inputLayers: [{ name: 'data', shape: [1, 300, 200, 200], validate: true }],
      },
    };
    wrongModelConfig.backendData = undefined;

    await testUtils.modelManagerPage.importModel('Caffe', wrongModelConfig, resource_dir);
    await testUtils.modelManagerPage.fillImportFormAndConvertModel(wrongModelConfig, resource_dir);

    await testUtils.configurationWizard.checkErrorMessageBox();
    await testUtils.configurationWizard.closeAllNotifications();

    await browser.sleep(1000);

    await testUtils.modelManagerPage.fillImportFormAndConvertModel(modelFile, resource_dir);
    await browser.wait(
      async () => await testUtils.configurationWizard.isUploadReady(modelFile.name),
      browser.params.defaultTimeout,
      'Upload is not ready'
    );
  });

  it('Upload TF model, select layout check input', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.yoloV3Tiny;
    modelFile.name = helpers.generateName();
    testUtils.uploadedModels.push(modelFile.name);

    const updateModelConfig: ModelFile = {
      ...modelFile,
      conversionSettings: {
        ...modelFile.conversionSettings,
        inputLayers: [{ name: 'image_input', shape: [1, 416, 416, 3], validate: true }],
      },
    };

    await testUtils.modelManagerPage.importModel('TensorFlow', updateModelConfig, resource_dir);
    await testUtils.modelManagerPage.fillImportFormAndConvertModel(updateModelConfig, resource_dir);
    await browser.wait(
      async () => await testUtils.configurationWizard.isUploadReady(modelFile.name),
      browser.params.defaultTimeout,
      'Upload is not ready'
    );
  });

  it('Upload Caffe model with Other layouts', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.mobilenet;
    modelFile.name = helpers.generateName();
    testUtils.uploadedModels.push(modelFile.name);

    const updateModelConfig: ModelFile = {
      ...modelFile,
      conversionSettings: {
        ...modelFile.conversionSettings,
        inputLayers: [{ name: 'data', shape: [1, 3, 300, 300], originalLayout: 'Other' }],
      },
    };
    await testUtils.modelManagerPage.importModel('Caffe', updateModelConfig, resource_dir);
    await testUtils.modelManagerPage.fillImportFormAndConvertModel(updateModelConfig, resource_dir);
    await browser.wait(
      async () => await testUtils.configurationWizard.isUploadReady(modelFile.name),
      browser.params.defaultTimeout,
      'Upload is not ready'
    );
  });

  afterAll(async () => {
    await testUtils.deleteUploadedModels();
    await testUtils.uploadedModels.pop();
    await TestUtils.getBrowserLogs();
  });
});
