import { browser, ElementFinder } from 'protractor';

import { TestUtils } from './pages/test-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';
import { AddRemoteMachinePo } from './pages/add-remote-machine.po';
import { TargetMachines } from './pages/target-machines.po';
import { InferenceType } from './pages/configuration-wizard.po';
import { InferenceUtils } from './pages/inference-utils';

describe('UI tests on remote machine configuration', () => {
  let testUtils: TestUtils;
  let analyticsPopup: AnalyticsPopup;
  let remoteMachineAdding: AddRemoteMachinePo;
  let targetMachines: TargetMachines;
  let inferenceUtils: InferenceUtils;
  let remoteMachineInfo;
  const resources = browser.params.precommit_scope.resources;
  const localMachineInfo = resources.targetMachines.localMachine;

  // Project data
  const datasetFileVoc = resources.smallVOCDataset;
  const inferenceTarget = InferenceType.CPU;

  beforeAll(async () => {
    testUtils = new TestUtils();
    analyticsPopup = new AnalyticsPopup();
    remoteMachineAdding = new AddRemoteMachinePo();
    targetMachines = new TargetMachines();
    inferenceUtils = new InferenceUtils();
    datasetFileVoc.name = testUtils.helpers.generateName();
    remoteMachineInfo = testUtils.getRemoteMachineInfo(browser.params.isMaster);
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.uploadDataset(datasetFileVoc);
  });

  beforeEach(async () => {
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.configurationWizard.selectEnvironmentStage();
  });

  it('Should check state of the remote profiling page', async () => {
    const wbMachineRow = await targetMachines.getMachineRow(localMachineInfo.name);

    expect(await targetMachines.machinesList.isPresent()).toBeTruthy();
    expect(await wbMachineRow.isPresent()).toBeTruthy();
    expect(await targetMachines.countMachinesOnConfigurationWizard()).toEqual(1);
  });

  it('Should add remote machine, check setup stages, check that machine is present in the table', async () => {
    const machineNumberBefore = await targetMachines.countMachinesOnConfigurationWizard();

    await remoteMachineAdding.addRemoteMachine(remoteMachineInfo);

    await targetMachines.checkSetupPipeline();

    const machineRow = await targetMachines.getMachineRow(remoteMachineInfo.name);
    expect(await machineRow.isPresent()).toBeTruthy();

    expect(await targetMachines.isMachineAvailable(machineRow)).toBeTruthy();

    expect(machineNumberBefore).toEqual((await targetMachines.countMachineOnTargetMachinesPage()) - 1);
  });

  it('Should delete one of the machines from the table, check that it is no longer present', async () => {
    const machineNumberBefore = await targetMachines.countMachinesOnConfigurationWizard();
    const machineRow: ElementFinder = await targetMachines.getMachineRow(remoteMachineInfo.name);

    await targetMachines.reviewTarget(machineRow);

    await targetMachines.deleteMachine(machineRow);

    expect(machineNumberBefore).toEqual((await targetMachines.countMachineOnTargetMachinesPage()) + 1);
  });

  it('Should add remote machine, select it in the table, run inference', async () => {
    const modelFile = resources.ODModels.ssdliteMobileNetV2;
    modelFile.name = testUtils.helpers.generateName();

    await remoteMachineAdding.addRemoteMachine(remoteMachineInfo);

    await targetMachines.checkSetupPipeline();

    const machineRow = await targetMachines.getMachineRow(remoteMachineInfo.name);
    expect(await machineRow.isPresent()).toBeTruthy();

    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();

    await inferenceUtils.runInference(
      modelFile,
      datasetFileVoc,
      inferenceTarget,
      browser.params.precommit_scope.resource_dir,
      false,
      remoteMachineInfo.name
    );

    // Deletion of the remote machine
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.configurationWizard.deleteUploadedModel(modelFile.name);
    await testUtils.uploadedModels.pop();
    await testUtils.configurationWizard.selectEnvironmentStage();
    await targetMachines.reviewTarget(machineRow);
    await targetMachines.deleteMachine(machineRow);
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });

  afterAll(async () => {
    await testUtils.deleteArtifacts();
    await TestUtils.getBrowserLogs();
  });
});
