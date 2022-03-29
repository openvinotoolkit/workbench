import { browser, ElementFinder } from 'protractor';

import { ModelPrecisionEnum } from '@store/model-store/model.model';
import { OptimizationAlgorithm, OptimizationAlgorithmPreset } from '@store/project-store/project.model';

import {
  AccuracyReportType,
  ClassificationReportEntityKey,
  DetectionReportEntityKey,
  TensorDistanceReportEntityKey,
} from '@shared/models/accuracy-analysis/accuracy-report';

import { InferenceType } from './pages/configuration-wizard.po';
import { Frameworks, TestUtils } from './pages/test-utils';
import { CalibrationUtils } from './pages/calibration-utils';
import { LoginPage } from './pages/login.po';
import { AddRemoteMachinePo } from './pages/add-remote-machine.po';
import { TargetMachines } from './pages/target-machines.po';
import { Helpers } from './pages/helpers';

describe('UI tests on Accuracy Reports', () => {
  const testUtils = new TestUtils();
  const calibrationUtils = new CalibrationUtils(testUtils);
  const inferenceTarget = InferenceType.CPU;
  const datasetFileVOC = browser.params.precommit_scope.resources.VOCDataset;
  const dataSetFileSemantic = browser.params.precommit_scope.resources.smallSemanticSegmentationDataset;
  const datasetFileImageNet = browser.params.precommit_scope.resources.smallImageNetDataset;
  let remoteMachineAdding: AddRemoteMachinePo;
  const targetMachines = new TargetMachines();
  let remoteMachineInfo = { name: '' };
  // TODO: 83042
  // const imageNetNotAnnotated = browser.params.precommit_scope.resources.imageNetNotAnnotated;

  beforeAll(async () => {
    await Helpers.setDevCloudCookies(browser.params.devCloudCookies);

    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await testUtils.analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();

    datasetFileVOC.name = testUtils.helpers.generateName();
    datasetFileImageNet.name = testUtils.helpers.generateName();
    // dataSetFileSemantic.name = testUtils.helpers.generateName();
    // imageNetNotAnnotated.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(datasetFileVOC);
    await testUtils.uploadDataset(datasetFileImageNet);
    // await testUtils.uploadDataset(dataSetFileSemantic);
    // await testUtils.uploadDataset(imageNetNotAnnotated);

    if (browser.params.isDevCloud) {
      jasmine.DEFAULT_TIMEOUT_INTERVAL *= 2.5;
    }

    if (browser.params.isRemote) {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = jasmine.DEFAULT_TIMEOUT_INTERVAL * 2;
      await testUtils.homePage.openConfigurationWizard();
      remoteMachineAdding = new AddRemoteMachinePo();
      remoteMachineInfo = testUtils.getRemoteMachineInfo(browser.params.isMaster);
      await testUtils.configurationWizard.selectEnvironmentStage();
      await remoteMachineAdding.addRemoteMachine(remoteMachineInfo);
      await targetMachines.checkSetupPipeline();
    }
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  it('should create a project with a classification model, calibrate it, create accuracy report (predictions comparison)', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.inceptionV2;
    await calibrationUtils.runInt8PipelineThroughUpload(
      modelFile,
      datasetFileImageNet,
      inferenceTarget,
      OptimizationAlgorithm.DEFAULT,
      OptimizationAlgorithmPreset.PERFORMANCE,
      remoteMachineInfo.name,
      100,
      true,
      browser.params.isDevCloud
    );
    await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile);

    // Create accuracy report (predictions comparison)
    await testUtils.accuracyReport.createAccuracyReport(AccuracyReportType.PARENT_MODEL_PREDICTIONS);
    // Check table and its data
    // Need to select manually as report type is not selected automatically
    const reportTypeElement: ElementFinder = await testUtils.accuracyReport.getReportButton(
      AccuracyReportType.PARENT_MODEL_PREDICTIONS
    );
    // Wait for reports to be loaded and button to be available
    await browser.wait(testUtils.until.elementToBeClickable(reportTypeElement), browser.params.defaultTimeout);
    await testUtils.clickElement(reportTypeElement);
    await browser.sleep(5000);
    expect(await TestUtils.getElementByDataTestId('data-table').isPresent()).toBeTruthy();

    // Check data
    const imageNames: string[] = await testUtils.accuracyReport.getColumnData(ClassificationReportEntityKey.IMAGE_NAME);
    expect(imageNames.length).toBeGreaterThan(0);
    for (const imageName of imageNames) {
      expect(imageName.toLowerCase().includes('.jpeg')).toBeTruthy();
    }

    // Check that top-1 prediction and ref prediction are equal in table if the position is 0
    const classes: string[] = await testUtils.accuracyReport.getColumnData(
      ClassificationReportEntityKey.ANNOTATION_CLASS_ID
    );
    const classesRanks: string[] = await testUtils.accuracyReport.getColumnData(
      ClassificationReportEntityKey.ANNOTATION_ID_RANK_IN_PREDICTIONS
    );
    expect(classesRanks.length).toBeGreaterThan(0);
    const top1Predictions: string[] = await testUtils.accuracyReport.getColumnData(
      ClassificationReportEntityKey.TOP_1_PREDICTION
    );

    for (const [index, classRank] of classesRanks.entries()) {
      if (parseInt(classRank, 10) === 0) {
        expect(classes[index]).toEqual(top1Predictions[index]);
      }
      expect(parseInt(classes[index], 10)).toBeGreaterThanOrEqual(0);
      expect(parseInt(top1Predictions[index], 10)).toBeGreaterThanOrEqual(0);
    }

    // Visualize image and check table with predictions
    await testUtils.accuracyReport.visualizeFirstImageInTheTable();
    expect(await TestUtils.getElementByDataTestId('predictions-table').isPresent()).toBeTruthy();
  });

  it('should create a project, calibrate it, create accuracy report (predictions & tensor comparisons) for an OD model', async () => {
    const modelFile = { name: 'ssd_mobilenet_v1_coco', framework: Frameworks.TENSORFLOW };
    await calibrationUtils.runInt8PipelineThroughDownloader(
      modelFile,
      datasetFileVOC,
      inferenceTarget,
      'FP16',
      OptimizationAlgorithm.DEFAULT,
      null,
      null,
      null,
      remoteMachineInfo.name,
      browser.params.isDevCloud
    );

    // Create accuracy report (predictions comparison)
    await testUtils.accuracyReport.createAccuracyReport(AccuracyReportType.PARENT_MODEL_PREDICTIONS);
    // Check table and its data
    // Need to select manually as report type is not selected automatically
    const reportTypeElement: ElementFinder = await testUtils.accuracyReport.getReportButton(
      AccuracyReportType.PARENT_MODEL_PREDICTIONS
    );
    // Wait for reports to be loaded and button to be available
    await browser.wait(testUtils.until.elementToBeClickable(reportTypeElement), browser.params.defaultTimeout * 2);
    await testUtils.clickElement(reportTypeElement);
    await browser.sleep(1000);
    expect(await TestUtils.getElementByDataTestId('data-table').isPresent()).toBeTruthy();

    // Check data
    const imageNames: string[] = await testUtils.accuracyReport.getColumnData(DetectionReportEntityKey.IMAGE_NAME);
    expect(imageNames.length).toBeGreaterThan(0);
    for (const imageName of imageNames) {
      expect(imageName.toLowerCase().includes('.jpg')).toBeTruthy();
    }

    // Toggle to advanced mode
    await testUtils.accuracyReport.elements.reportModeSwitch.click();

    const classes: string[] = await testUtils.accuracyReport.getColumnData(DetectionReportEntityKey.CLASS_ID);
    expect(classes.length).toBeGreaterThan(0);
    for (const classID of classes) {
      expect(parseInt(classID, 10)).toBeGreaterThanOrEqual(0);
    }

    // Visualize image and check tables with predictions
    await testUtils.accuracyReport.visualizeFirstImageInTheTable();
    expect(await TestUtils.getAllElementsByDataTestId('predictions-table').count()).toBeGreaterThan(1);
  });

  // TODO: 70558, 82461
  xit(
    'should download a semantic segmentation model (deeplabv3), ' +
      'int8 calibration, check that predictions comparison is available and that tensor comparison is available, ' +
      'create tensor comparison report',
    async () => {
      // TODO: 71541
      if (browser.params.isDevCloud) {
        return;
      }

      const model = {
        name: 'deeplabv3',
        framework: Frameworks.TENSORFLOW,
      };
      await calibrationUtils.runInt8PipelineThroughDownloader(
        model,
        dataSetFileSemantic,
        InferenceType.CPU,
        ModelPrecisionEnum.FP16,
        OptimizationAlgorithm.DEFAULT,
        10,
        null,
        null,
        remoteMachineInfo.name,
        browser.params.isDevCloud
      );
      await testUtils.accuracyReport.goToAccuracyReportCreationTab();
      expect(
        await testUtils.accuracyReport.isReportAvailable(AccuracyReportType.PARENT_MODEL_PREDICTIONS)
      ).toBeTruthy();
      expect(await testUtils.accuracyReport.isReportAvailable(AccuracyReportType.PARENT_MODEL_PER_TENSOR)).toBeTruthy();

      await testUtils.accuracyReport.createAccuracyReport(AccuracyReportType.PARENT_MODEL_PER_TENSOR);
      // Check data
      // Check images
      const imageNames: string[] = await testUtils.accuracyReport.getColumnData(
        TensorDistanceReportEntityKey.IMAGE_NAME
      );
      expect(imageNames.length).toBeGreaterThan(0);
      for (const imageName of imageNames) {
        expect(imageName.toLowerCase().includes('.jpeg')).toBeTruthy();
      }

      // Check output layer names
      const outputNames: string[] = await testUtils.accuracyReport.getColumnData(
        TensorDistanceReportEntityKey.OUTPUT_NAME
      );
      expect(outputNames.length).toBeGreaterThan(0);
      for (const name of outputNames) {
        expect(name).toEqual(testUtils.accuracyReport.testLayerName);
      }

      // Check that MSE is populated
      const mseValues: string[] = await testUtils.accuracyReport.getColumnData(TensorDistanceReportEntityKey.MSE);
      expect(mseValues.length).toBeGreaterThan(0);
      for (let mseValue of mseValues) {
        // The only acceptable special character
        if (mseValue.includes('<')) {
          mseValue = mseValue.replace('<', '');
        }
        expect(parseFloat(mseValue)).toBeGreaterThanOrEqual(0);
      }

      expect(imageNames.length).toEqual(outputNames.length);
      expect(imageNames.length).toEqual(mseValues.length);

      // Check visualization
      await testUtils.accuracyReport.visualizeFirstImageInTheTable();
      const outputNameInTable: string = await testUtils.accuracyReport.elements.outputName.getText();
      expect(outputNameInTable).toEqual(testUtils.accuracyReport.testLayerName);
      const mseValueInTable: string = await testUtils.accuracyReport.elements.mseValue.getText();
      expect(parseFloat(mseValueInTable)).toBeGreaterThanOrEqual(0);

      // Evaluate accuracy and check that the accuracy value is present on the Analyze tab
      const accuracyValueProject: string = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(
        model,
        true
      );
      await browser.sleep(1000);
      const accuracyValueFromReport: string = await testUtils.accuracyReport.getAccuracyValueFromReport();
      expect(parseFloat(accuracyValueProject)).toEqual(parseFloat(accuracyValueFromReport));

      // Check that config is filled
      await testUtils.advancedAccuracy.goToAccuracyConfiguration(true);
      expect(await testUtils.advancedAccuracy.isAdvancedAccuracyOpened()).toBeTruthy();
      expect(await testUtils.advancedAccuracy.isConfigurationValid()).toBeTruthy();
      await testUtils.advancedAccuracy.clickSaveAccuracy(true);
    }
  );

  // TODO: 70558, 83042
  xit(
    'should download a semantic segmentation model (deeplabv3), not-annotated dataset' +
      'int8 calibration, check that predictions comparison is available and that tensor comparison is available, ' +
      'create comparison report',
    async () => {
      const model = {
        name: 'deeplabv3',
        framework: Frameworks.TENSORFLOW,
      };
      /* await calibrationUtils.runInt8PipelineThroughDownloader(
        model,
        imageNetNotAnnotated,
        InferenceType.CPU,
        ModelPrecisionEnum.FP16,
        OptimizationAlgorithm.DEFAULT,
        10,
        null,
        null,
        remoteMachineInfo.name
      ); */
      await testUtils.accuracyReport.goToAccuracyReportCreationTab();
      expect(
        await testUtils.accuracyReport.isReportAvailable(AccuracyReportType.PARENT_MODEL_PREDICTIONS)
      ).toBeTruthy();
      expect(await testUtils.accuracyReport.isReportAvailable(AccuracyReportType.PARENT_MODEL_PER_TENSOR)).toBeTruthy();

      await testUtils.accuracyReport.createAccuracyReport(AccuracyReportType.PARENT_MODEL_PREDICTIONS);
      // Check table and its data
      // Need to select manually as report type is not selected automatically
      const reportTypeElement: ElementFinder = await testUtils.accuracyReport.getReportButton(
        AccuracyReportType.PARENT_MODEL_PREDICTIONS
      );
      await testUtils.clickElement(reportTypeElement);
      await browser.wait(
        testUtils.until.presenceOf(await TestUtils.getElementByDataTestId('data-table')),
        browser.params.defaultTimeout
      );
      expect(await TestUtils.getElementByDataTestId('data-table').isPresent()).toBeTruthy();

      // Check data
      const imageNames: string[] = await testUtils.accuracyReport.getColumnData(
        ClassificationReportEntityKey.IMAGE_NAME
      );
      expect(imageNames.length).toBeGreaterThan(0);

      // Visualize image and check table with predictions
      await testUtils.accuracyReport.visualizeFirstImageInTheTable();
      expect(await TestUtils.getElementByDataTestId('predictions-table').isPresent()).toBeTruthy();
    }
  );

  // TODO: 73953, 83042
  xit(
    'should create a project with a generic model, calibrate it, configure accuracy (OD), ' +
      'create accuracy report (predictions comparison)',
    async () => {
      const modelFile = browser.params.precommit_scope.resources.ODModels.yoloV4TinyIR;
      /* await calibrationUtils.runInt8PipelineThroughUpload(
        modelFile,
        imageNetNotAnnotated,
        inferenceTarget,
        OptimizationAlgorithm.DEFAULT,
        OptimizationAlgorithmPreset.PERFORMANCE,
        remoteMachineInfo.name,
        100,
        false,
        browser.params.isDevCloud
      ); */

      // Provide accuracy configuration
      await testUtils.accuracyReport.goToAccuracyReportCreationTab();
      expect(await testUtils.accuracyReport.isReportAvailable(AccuracyReportType.PARENT_MODEL_PREDICTIONS)).toBeFalsy();
      await testUtils.clickElement(testUtils.accuracyReport.elements.provideAccuracyConfig);
      await testUtils.modelManagerPage.saveAccuracyButton.click();
      await browser.sleep(1500);
      expect(
        await testUtils.accuracyReport.isReportAvailable(AccuracyReportType.PARENT_MODEL_PREDICTIONS)
      ).toBeTruthy();

      // Create accuracy report (predictions comparison)
      await testUtils.accuracyReport.createAccuracyReport(AccuracyReportType.PARENT_MODEL_PREDICTIONS);
      // Check table and its data
      // Need to select manually as report type is not selected automatically
      const reportTypeElement: ElementFinder = await testUtils.accuracyReport.getReportButton(
        AccuracyReportType.PARENT_MODEL_PREDICTIONS
      );
      await testUtils.clickElement(reportTypeElement);
      await browser.sleep(1000);
      expect(await TestUtils.getElementByDataTestId('data-table').isPresent()).toBeTruthy();

      // Check data
      const imageNames: string[] = await testUtils.accuracyReport.getColumnData(
        ClassificationReportEntityKey.IMAGE_NAME
      );
      expect(imageNames.length).toBeGreaterThan(0);

      // Visualize image and check table with predictions
      await testUtils.accuracyReport.visualizeFirstImageInTheTable();
      expect(await TestUtils.getElementByDataTestId('predictions-table').isPresent()).toBeTruthy();
    }
  );

  // TODO: 73953, 83042
  xit(
    'should create a project with a generic model and not-annotated dataset, calibrate, ' +
      'create another project with annotated dataset, ' +
      'go back to the calibrated project, configure accuracy (OD), ' +
      'go back to the second project, check that accuracy is available, run accuracy',
    async () => {
      const modelFile = browser.params.precommit_scope.resources.ODModels.ssdliteMobileNetV2;
      /* await calibrationUtils.runInt8PipelineThroughUpload(
        modelFile,
        imageNetNotAnnotated,
        inferenceTarget,
        OptimizationAlgorithm.DEFAULT,
        OptimizationAlgorithmPreset.PERFORMANCE,
        remoteMachineInfo.name,
        100,
        false,
        browser.params.isDevCloud
      ); */

      // Create project with annotated dataset
      await testUtils.homePage.openConfigurationWizard();
      await testUtils.configurationWizard.selectModelForInference(modelFile.name);
      await testUtils.configurationWizard.selectDatasetRow(datasetFileVOC);
      await testUtils.configurationWizard.runInference(inferenceTarget, false);
      console.log('GO (inference) button clicked');

      await testUtils.inferenceCard.waitForInferenceOverlay();
      await testUtils.waitForProjectToBeReady();
      await browser.sleep(1500);

      // Open INT8 project
      // await testUtils.homePage.openProjectByModelAndDatasetNames(modelFile.name, imageNetNotAnnotated.name, true);
      await browser.sleep(1000);
      // Configure accuracy
      await testUtils.advancedAccuracy.goToAccuracyConfiguration();
      await browser.sleep(2000);
      await testUtils.advancedAccuracy.goFromBasicToAdvanced();
      await browser.sleep(2000);
      // There will be a template
      expect(await testUtils.advancedAccuracy.isConfigurationValid()).toBeFalsy();
      expect(await testUtils.advancedAccuracy.isSaveAccuracyButtonEnabled()).toBeFalsy();
      // Check that editor is filled with template
      const editorLines: string[] = await testUtils.advancedAccuracy.getCurrentConfigFromEditor();
      expect(editorLines.length).toBeGreaterThan(0);
      expect(editorLines.includes(`name: ${modelFile.name}`)).toBeTruthy();
      expect(editorLines.includes('launchers:')).toBeTruthy();
      expect(editorLines.includes('datasets:')).toBeTruthy();
      await browser.waitForAngularEnabled(true);

      // await testUtils.homePage.openProjectByModelAndDatasetNames(modelFile.name, imageNetNotAnnotated.name, true);
      await testUtils.advancedAccuracy.goToAccuracyConfiguration();
      await browser.sleep(1500);
      await testUtils.modelManagerPage.configureAccuracySettingsAndSave(
        modelFile.accuracyData.adapter.taskType,
        modelFile.accuracyData,
        true
      );
      await browser.sleep(1000);

      // Go to the second project, with annotated dataset
      await testUtils.homePage.openProjectByModelAndDatasetNames(modelFile.name, datasetFileVOC.name);
      await browser.sleep(1000);
      // Measure accuracy
      await testUtils.accuracyReport.goToAccuracyReportCreationTab();
      expect(await testUtils.accuracyReport.isAccuracyAvailable()).toBeTruthy();
      const accuracy: string = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile, false);
      expect(+accuracy).toEqual(
        modelFile.accuracyData.accuracyValue,
        `Accuracy: ${accuracy} is not equal to expected: ${modelFile.accuracyData.accuracyValue}`
      );
    }
  );

  // TODO: 73953, 83042
  xit(
    'should create a project with a classification model & ' +
      'not-annotated dataset, calibrate it, create accuracy report (predictions comparison), ' +
      'check that advanced config is filled',
    async () => {
      const modelFile = { name: 'squeezenet1.1-caffe2', framework: Frameworks.CAFFE2 };
      /* await calibrationUtils.runInt8PipelineThroughDownloader(
        modelFile,
        imageNetNotAnnotated,
        inferenceTarget,
        ModelPrecisionEnum.FP16,
        OptimizationAlgorithm.DEFAULT,
        10,
        null,
        null,
        remoteMachineInfo.name,
        browser.params.isDevCloud
      ); */

      // Create accuracy report (predictions comparison)
      await testUtils.accuracyReport.createAccuracyReport(AccuracyReportType.PARENT_MODEL_PREDICTIONS);
      // Check table and its data
      // Need to select manually as report type is not selected automatically
      const reportTypeElement: ElementFinder = await testUtils.accuracyReport.getReportButton(
        AccuracyReportType.PARENT_MODEL_PREDICTIONS
      );
      // Wait for reports to be loaded and button to be available
      await browser.wait(testUtils.until.elementToBeClickable(reportTypeElement), browser.params.defaultTimeout);
      await testUtils.clickElement(reportTypeElement);
      await browser.sleep(1000);
      expect(await TestUtils.getElementByDataTestId('data-table').isPresent()).toBeTruthy();

      // Check data
      const imageNames: string[] = await testUtils.accuracyReport.getColumnData(
        ClassificationReportEntityKey.IMAGE_NAME
      );
      expect(imageNames.length).toBeGreaterThan(0);
      for (const imageName of imageNames) {
        expect(imageName.toLowerCase().includes('.jpeg')).toBeTruthy();
      }

      // Check that top-1 prediction and ref prediction are equal in table if the position is 0
      const classes: string[] = await testUtils.accuracyReport.getColumnData(
        ClassificationReportEntityKey.ANNOTATION_CLASS_ID
      );
      const classesRanks: string[] = await testUtils.accuracyReport.getColumnData(
        ClassificationReportEntityKey.ANNOTATION_ID_RANK_IN_PREDICTIONS
      );
      expect(classesRanks.length).toBeGreaterThan(0);
      const top1Predictions: string[] = await testUtils.accuracyReport.getColumnData(
        ClassificationReportEntityKey.TOP_1_PREDICTION
      );

      for (const [index, classRank] of classesRanks.entries()) {
        if (parseInt(classRank, 10) === 0) {
          expect(classes[index]).toEqual(top1Predictions[index]);
        }
        expect(parseInt(classes[index], 10)).toBeGreaterThanOrEqual(0);
        expect(parseInt(top1Predictions[index], 10)).toBeGreaterThanOrEqual(0);
      }

      // Go and check advanced accuracy
      await testUtils.advancedAccuracy.goToAccuracyConfiguration(true);
      // Check that advanced is opened
      await browser.sleep(5000);
      expect(await testUtils.advancedAccuracy.isAdvancedAccuracyOpened()).toBeTruthy(
        'Not advanced accuracy is opened.'
      );
      // Check that config is valid
      expect(await testUtils.advancedAccuracy.isConfigurationValid()).toBeTruthy(
        'Advanced accuracy is not valid but should be.'
      );

      await testUtils.advancedAccuracy.clickSaveAccuracy(true);
      await browser.refresh();
      await browser.sleep(1000);
    }
  );

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await testUtils.deleteUploadedModels();
    await testUtils.uploadedModels.pop();
    await TestUtils.getBrowserLogs();
  });

  afterAll(async () => {
    if (browser.params.isRemote) {
      await testUtils.homePage.openConfigurationWizard();
      await testUtils.configurationWizard.selectEnvironmentStage();
      const machineRow: ElementFinder = await targetMachines.getMachineRow(remoteMachineInfo.name);
      await targetMachines.reviewTarget(machineRow);
      await targetMachines.deleteMachine(machineRow);
    }

    await testUtils.deleteUploadedDatasets();
    await TestUtils.getBrowserLogs();
  });
});
