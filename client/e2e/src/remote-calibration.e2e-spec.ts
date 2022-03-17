import { browser } from 'protractor';

import { OptimizationAlgorithm, OptimizationAlgorithmPreset } from '@store/project-store/project.model';

import { TestUtils } from './pages/test-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';
import { AddRemoteMachinePo } from './pages/add-remote-machine.po';
import { TargetMachines } from './pages/target-machines.po';
import { InferenceType } from './pages/configuration-wizard.po';
import { InferenceUtils } from './pages/inference-utils';
import { CalibrationUtils } from './pages/calibration-utils';

describe('UI tests on remote calibration', () => {
  let testUtils: TestUtils;
  let analyticsPopup: AnalyticsPopup;
  let remoteMachineAdding: AddRemoteMachinePo;
  let targetMachines: TargetMachines;
  let inferenceUtils: InferenceUtils;
  let calibrationUtils: CalibrationUtils;
  let remoteMachineInfo;
  const resources = browser.params.precommit_scope.resources;

  // Project data
  const datasetFileVoc = resources.smallVOCDataset;
  const datasetFileImageNet = resources.imageNetDataset;
  const datasetFileCOCO = resources.cocoDataset;
  const inferenceTarget = InferenceType.CPU;

  beforeAll(async () => {
    testUtils = new TestUtils();
    analyticsPopup = new AnalyticsPopup();
    remoteMachineAdding = new AddRemoteMachinePo();
    targetMachines = new TargetMachines();
    inferenceUtils = new InferenceUtils();
    calibrationUtils = new CalibrationUtils();
    datasetFileVoc.name = testUtils.helpers.generateName();
    datasetFileImageNet.name = testUtils.helpers.generateName();
    datasetFileCOCO.name = testUtils.helpers.generateName();
    remoteMachineInfo = testUtils.getRemoteMachineInfo(browser.params.isMaster);
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.uploadDataset(datasetFileVoc);
    await testUtils.uploadDataset(datasetFileImageNet);
    await testUtils.uploadDataset(datasetFileCOCO);

    // Add remote machine
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.configurationWizard.selectEnvironmentStage();
    await remoteMachineAdding.addRemoteMachine(remoteMachineInfo);
    await targetMachines.checkSetupPipeline();
    const machineRow = await targetMachines.getMachineRow(remoteMachineInfo.name);
    expect(await machineRow.isPresent()).toBeTruthy();
  });

  beforeEach(async () => {
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  // 52012
  xit('Should run inference, run INT-8 calibration on the remote machine with OD IR model', async () => {
    const modelFile = resources.ODModels.ssdliteMobileNetV2;
    modelFile.name = testUtils.helpers.generateName();

    await calibrationUtils.runInt8PipelineThroughUpload(
      modelFile,
      datasetFileVoc,
      inferenceTarget,
      OptimizationAlgorithm.DEFAULT,
      OptimizationAlgorithmPreset.PERFORMANCE,
      remoteMachineInfo.name
    );

    await testUtils.homePage.openConfigurationWizard();
    await testUtils.configurationWizard.deleteUploadedModel(modelFile.name);
    await testUtils.uploadedModels.pop();
  });

  it('Should run inference, run INT-8 calibration on the remote machine with Classification Caffe model', async () => {
    const modelFile = resources.classificationModels.squeezenetV1;
    modelFile.name = testUtils.helpers.generateName();

    await calibrationUtils.runInt8PipelineThroughUpload(
      modelFile,
      datasetFileImageNet,
      inferenceTarget,
      OptimizationAlgorithm.DEFAULT,
      OptimizationAlgorithmPreset.PERFORMANCE,
      remoteMachineInfo.name
    );

    await testUtils.homePage.openConfigurationWizard();
    await testUtils.configurationWizard.deleteUploadedModel(modelFile.name);
    await testUtils.uploadedModels.pop();
  });

  // 78859
  xit('Should run inference, run INT-8 calibration on the remote machine with COCO model from OMZ', async () => {
    const modelFile = { name: 'ssd_mobilenet_v1_coco' };

    await calibrationUtils.runInt8PipelineThroughDownloader(
      modelFile,
      datasetFileCOCO,
      inferenceTarget,
      undefined,
      OptimizationAlgorithm.DEFAULT,
      100,
      OptimizationAlgorithmPreset.PERFORMANCE,
      10,
      remoteMachineInfo.name
    );

    await testUtils.homePage.openConfigurationWizard();
    await testUtils.configurationWizard.deleteUploadedModel(modelFile.name);
    await testUtils.uploadedModels.pop();
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });

  afterAll(async () => {
    // Delete remote machine
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.configurationWizard.selectEnvironmentStage();
    const machineRow = await targetMachines.getMachineRow(remoteMachineInfo.name);
    await targetMachines.reviewTarget(machineRow);
    await targetMachines.deleteMachine(machineRow);

    await testUtils.deleteArtifacts();
    await TestUtils.getBrowserLogs();
  });
});
