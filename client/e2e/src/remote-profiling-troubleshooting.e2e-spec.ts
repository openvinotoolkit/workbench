import { browser, ElementFinder } from 'protractor';

import {
  AuthStageErrorsEnum,
  pipelineStageErrorNameMap,
  RemoteSetupStageErrorsEnum,
  SetupTargetPipelineStagesEnum,
} from '@shared/models/pipelines/target-machines/configure-target-pipeline';

import { TestUtils } from './pages/test-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';
import { AddRemoteMachinePo } from './pages/add-remote-machine.po';
import { TargetMachines } from './pages/target-machines.po';

describe('UI tests on remote machine setup troubleshooting', () => {
  let testUtils: TestUtils;
  let analyticsPopup: AnalyticsPopup;
  let remoteMachineAdding: AddRemoteMachinePo;
  let targetMachines: TargetMachines;
  let remoteMachineInfo;
  const resources = browser.params.precommit_scope.resources;
  const remoteIncorrectMachineInfo = resources.targetMachines.remoteMachineIncorrect;

  beforeAll(async () => {
    testUtils = new TestUtils();
    analyticsPopup = new AnalyticsPopup();
    remoteMachineAdding = new AddRemoteMachinePo();
    targetMachines = new TargetMachines();
    remoteMachineInfo = testUtils.getRemoteMachineInfo(browser.params.isMaster);
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();
  });

  beforeEach(async () => {
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.configurationWizard.selectEnvironmentStage();
  });

  it('Should try to add machine with incorrect data - hostname, check timeout error, delete machine', async () => {
    await remoteMachineAdding.addRemoteMachine(remoteIncorrectMachineInfo);

    await targetMachines.checkSetupPipeline(
      true,
      pipelineStageErrorNameMap[AuthStageErrorsEnum.TIMEOUT],
      SetupTargetPipelineStagesEnum.UPLOADING_SETUP_ASSETS
    );

    const machineRow: ElementFinder = await targetMachines.getMachineRow(remoteIncorrectMachineInfo.name);
    expect(await machineRow.isPresent()).toBeTruthy();

    expect(await targetMachines.isMachineNotSelectable(machineRow)).toBeTruthy();

    await targetMachines.deleteMachine(machineRow);
  });

  it('Should try to add machine without proxies, check no internet connection error, delete machine', async () => {
    const remoteMachineNoProxy = { ...remoteMachineInfo, hasProxy: false };
    await remoteMachineAdding.addRemoteMachine(remoteMachineNoProxy);

    await targetMachines.checkSetupPipeline(
      true,
      pipelineStageErrorNameMap[RemoteSetupStageErrorsEnum.NO_INTERNET_CONNECTION],
      SetupTargetPipelineStagesEnum.CONFIGURING_ENVIRONMENT
    );

    const machineRow: ElementFinder = await targetMachines.getMachineRow(remoteMachineNoProxy.name);

    await browser.sleep(2000);

    expect(await machineRow.isPresent()).toBeTruthy();

    expect(await targetMachines.isMachineNotSelectable(machineRow)).toBeTruthy();

    await targetMachines.deleteMachine(machineRow);
  });

  it('Should try to add machine with incorrect port, check auth error, delete machine', async () => {
    const remoteMachineWrongPort = { ...remoteMachineInfo, port: 777 };
    await remoteMachineAdding.addRemoteMachine(remoteMachineWrongPort);

    await targetMachines.checkSetupPipeline(
      true,
      pipelineStageErrorNameMap[AuthStageErrorsEnum.SSH_AUTH_ERROR],
      SetupTargetPipelineStagesEnum.UPLOADING_SETUP_ASSETS
    );

    const machineRow: ElementFinder = await targetMachines.getMachineRow(remoteMachineWrongPort.name);
    expect(await machineRow.isPresent()).toBeTruthy();

    expect(await targetMachines.isMachineNotSelectable(machineRow)).toBeTruthy();

    await targetMachines.deleteMachine(machineRow);
  });

  it('Should try to add machine with incorrect ssh key, check error, delete machine', async () => {
    const remoteMachineInvalidSSHKey = { ...remoteMachineInfo, sshKey: 'remote_profiling/sshKeyIncorrect' };
    await remoteMachineAdding.addRemoteMachine(remoteMachineInvalidSSHKey);

    await browser.sleep(2000);

    const machineRow: ElementFinder = await targetMachines.getMachineRow(remoteMachineInvalidSSHKey.name);
    expect(await machineRow.isPresent()).toBeTruthy();

    expect(await targetMachines.isMachineNotSelectable(machineRow)).toBeTruthy();

    await targetMachines.deleteMachine(machineRow);
  });

  it('Should try to add machine with incorrect user in ssh key, check error, delete machine', async () => {
    const remoteMachineInvalidSSHKey = { ...remoteMachineInfo, sshKey: 'remote_profiling/sshKeyIncorrectUser' };
    await remoteMachineAdding.addRemoteMachine(remoteMachineInvalidSSHKey);

    await targetMachines.checkSetupPipeline(
      true,
      pipelineStageErrorNameMap[AuthStageErrorsEnum.INCORRECT_KEY],
      SetupTargetPipelineStagesEnum.UPLOADING_SETUP_ASSETS
    );

    const machineRow: ElementFinder = await targetMachines.getMachineRow(remoteMachineInvalidSSHKey.name);
    expect(await machineRow.isPresent()).toBeTruthy();

    expect(await targetMachines.isMachineNotSelectable(machineRow)).toBeTruthy();

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
