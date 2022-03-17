import { browser, by, element, ElementFinder, protractor } from 'protractor';

import { TargetMachineStatusNames } from '@shared/models/pipelines/target-machines/target-machine';
import {
  PingTargetPipelineStagesEnum,
  PipelineStageStatusNames,
  SetupTargetPipelineStagesEnum,
} from '@shared/models/pipelines/target-machines/configure-target-pipeline';

import { TestUtils } from './test-utils';
import { ConfigurationWizardPage } from './configuration-wizard.po';

export enum DevCloudTargets {
  CORE = 'idc047',
  XEON = 'idc052',
  ATOM = 'idc010jal',
}

export class TargetMachines {
  until = protractor.ExpectedConditions;
  configurationWizard: ConfigurationWizardPage;

  constructor() {
    this.configurationWizard = new ConfigurationWizardPage();
  }

  getMachineRow(machineName: string): ElementFinder {
    return TestUtils.getElementByDataTestId(`row_name_${machineName}`);
  }

  get machinesList() {
    return TestUtils.getElementByDataTestId('targets-table');
  }

  get platformsList() {
    return TestUtils.getElementByDataTestId('platforms-table');
  }

  get allDevices() {
    return TestUtils.getAllElementsByDataTestId('device');
  }

  get machineDetailsSidePanel() {
    return TestUtils.getElementByDataTestId('machine-details');
  }

  async countTargets() {
    const machinesList = await this.machinesList;
    return await machinesList.all(by.className('mat-row')).count();
  }

  async getCellByPlatformTag(tag: string): Promise<ElementFinder> {
    const platformsItems = await this.platformsList;
    const cell = platformsItems.element(by.cssContainingText('.platform-tag-column', tag));
    return await cell;
  }

  async getMachineDetail(name: string): Promise<ElementFinder> {
    const postfix = '_detail';
    return TestUtils.getElementByDataTestId(`${name + postfix}`);
  }

  async pingMachine(machineName: string) {
    const machineRow = await this.getMachineRow(machineName);
    const pingButton = await TestUtils.getNestedElementByDataTestId(machineRow, 'ping-machine');
    await new TestUtils().clickElement(pingButton);
    console.log('Refresh is clicked.');
    await this.checkStages(PingTargetPipelineStagesEnum);
    console.log('Ping is complete.');
  }

  async reviewTarget(machineRow: ElementFinder) {
    const reviewBtn: ElementFinder = await TestUtils.getNestedElementByDataTestId(machineRow, 'review-target');

    await new TestUtils().clickElement(reviewBtn);
    await browser.sleep(3000);
  }

  async isMachineNotSelectable(machineRow: ElementFinder): Promise<boolean> {
    return (
      (await TestUtils.getNestedElementByDataTestId(
        machineRow,
        `${TargetMachineStatusNames.CONFIGURATION_FAILURE}`
      ).isPresent()) ||
      (await TestUtils.getNestedElementByDataTestId(
        machineRow,
        `${TargetMachineStatusNames.CONNECTION_FAILURE}`
      ).isPresent())
    );
  }

  async isMachineAvailable(machineRow: ElementFinder): Promise<boolean> {
    return await TestUtils.getNestedElementByDataTestId(
      machineRow,
      `${TargetMachineStatusNames.AVAILABLE}`
    ).isPresent();
  }

  async isStageSuccessful(stageName: string): Promise<boolean> {
    const stageRow: ElementFinder = await TestUtils.getElementByDataTestId(stageName);
    const successStatus: ElementFinder = await TestUtils.getNestedElementByDataTestId(
      stageRow,
      `${PipelineStageStatusNames.SUCCESS}`
    );
    return browser.isElementPresent(successStatus);
  }

  async isWarningPresent(stageName: string): Promise<boolean> {
    const stageRow: ElementFinder = await TestUtils.getElementByDataTestId(stageName);
    const warningStatus: ElementFinder = await TestUtils.getNestedElementByDataTestId(
      stageRow,
      `${PipelineStageStatusNames.WARNING}`
    );
    return browser.isElementPresent(warningStatus);
  }

  async isStageUnsuccessful(stageName: string): Promise<boolean> {
    const stageRow: ElementFinder = await TestUtils.getElementByDataTestId(stageName);
    const failureStatus: ElementFinder = await TestUtils.getNestedElementByDataTestId(
      stageRow,
      `${PipelineStageStatusNames.FAILURE}`
    );
    return browser.isElementPresent(failureStatus);
  }

  async checkStages(
    stagesEnum,
    shouldFail: boolean = false,
    errorText = '',
    failingStage?: SetupTargetPipelineStagesEnum
  ) {
    for (const stage of Object.keys(stagesEnum)) {
      console.log(`Waiting for ${stagesEnum[stage]} to complete.`);

      await browser
        .wait(async () => {
          if (shouldFail && failingStage === stagesEnum[stage]) {
            await browser
              .wait(async () => {
                return await this.isStageUnsuccessful(stagesEnum[stage]);
              }, Number(browser.params.defaultTimeout * 3))
              .then(async () => {
                await this.checkErrorMessage(stagesEnum[stage], errorText);
                console.log('This stage was to fail.');
                return true;
              });
            console.log('Stage failed successfully.');
            return true;
          }
          const success = await this.isStageSuccessful(stagesEnum[stage]);
          const warning = await this.isWarningPresent(stagesEnum[stage]);
          return success || warning;
        }, browser.params.defaultTimeout * 3)
        .then(async () => {
          console.log(`${stagesEnum[stage]} is successful.`);
        })
        .catch(async (error) => {
          console.log(error);
          await this.getSetupStageLogs(stagesEnum[stage]);
          throw new Error(`${stagesEnum[stage]} failed.`);
        });
      if (shouldFail && failingStage === stagesEnum[stage]) {
        console.log('This stage was to fail');
        break;
      }
    }
    return true;
  }

  async checkSetupPipeline(
    shouldFail: boolean = false,
    errorText: string = '',
    failingStage?: SetupTargetPipelineStagesEnum
  ) {
    await this.checkStages(SetupTargetPipelineStagesEnum, shouldFail, errorText, failingStage);
    if (shouldFail) {
      return true;
    }
    console.log('Setup passed.');
    await this.checkStages(PingTargetPipelineStagesEnum);
    console.log('Machine info collecting passed.');
  }

  async getSetupStageLogs(stageName: string) {
    const stageRow: ElementFinder = await TestUtils.getElementByDataTestId(stageName);
    await new TestUtils().clickElement(TestUtils.getNestedElementByDataTestId(stageRow, 'details'));
    console.log('Stage details btn is clicked.');
    await browser.sleep(700);

    const logs = await TestUtils.getNestedElementByDataTestId(stageRow, 'stage-logs').getText();
    console.log(`\n STAGE LOGS:\n${logs}`);

    const stageError = await TestUtils.getNestedElementByDataTestId(stageRow, 'stage-error');
    if (await stageError.isPresent()) {
      console.log(await stageError.getText());
    }
  }

  async checkErrorMessage(stageName: string, errorType: string) {
    const stageRow: ElementFinder = await TestUtils.getElementByDataTestId(stageName);
    await new TestUtils().clickElement(TestUtils.getNestedElementByDataTestId(stageRow, 'show-more-details'));
    console.log('Show more info is clicked.');
    await browser.sleep(700);

    const troubleShootingPart: ElementFinder = await TestUtils.getNestedElementByDataTestId(
      stageRow,
      'troubleshooting-part'
    );

    const warningLabel: string = await TestUtils.getNestedElementByDataTestId(
      troubleShootingPart,
      'status-label'
    ).getText();
    expect(warningLabel.trim().toLowerCase()).toEqual(errorType.toLowerCase(), 'Errors do not match.');

    const warningMessage: string = await TestUtils.getNestedElementByDataTestId(
      troubleShootingPart,
      'troubleshooting-message'
    ).getText();
    expect(warningMessage.trim()).toBeTruthy('Warning message is empty/not shown.');
  }

  async expandMachineDetails(machineName: string) {
    const machineRow: ElementFinder = await this.getMachineRow(machineName);
    await new TestUtils().clickElement(TestUtils.getNestedElementByDataTestId(machineRow, 'target-machine-details'));
    await browser.sleep(700);
    expect(await this.machineDetailsSidePanel.isPresent()).toBeTruthy('Machine details side panel did not open.');
    console.log('Machine details are expanded.');
  }

  async deleteMachine(machineRow: ElementFinder) {
    await TestUtils.takeScreenshot();
    const deleteBtn: ElementFinder = await machineRow.element(by.id('delete-target'));
    await new TestUtils().clickElement(deleteBtn);
    await browser.sleep(1000);
    console.log('Machine is deleted.');
  }

  async countMachineOnTargetMachinesPage() {
    return element.all(by.css('[data-test-id="remote-machines-table"] tbody tr')).count();
  }

  async countMachinesOnConfigurationWizard() {
    return element.all(by.css('[data-test-id="targets-table"] tbody tr')).count();
  }

  async selectMachineRow(machineName: string) {
    const machineRow: ElementFinder = await this.getMachineRow(machineName);
    await new TestUtils().clickElement(machineRow);
  }

  async goToEdit(machineName: string) {
    const machineRow: ElementFinder = await this.getMachineRow(machineName);
    const editBtn: ElementFinder = await TestUtils.getNestedElementByDataTestId(machineRow, 'edit-machine-info');
    await new TestUtils().clickElement(editBtn);
    console.log('Entered Edit.');
  }

  async checkDevices(machineInfo) {
    const machineRow: ElementFinder = await this.getMachineRow(machineInfo.name);
    await new TestUtils().clickElement(machineRow);

    const deviceElements = await this.allDevices;

    for (let i = 0; i < deviceElements.length; i++) {
      const deviceName: string = await deviceElements[i].getText();
      console.log(`Device name: ${deviceName}`);
      expect(machineInfo.machineSpecs.devices.toLowerCase()).toContain(deviceName.toLowerCase());
    }
  }

  async getSystemInfoValue(itemData: ElementFinder) {
    const valueEl: ElementFinder = await TestUtils.getNestedElementByDataTestId(itemData, 'value');
    return await valueEl.getText();
  }

  async checkSystemResources() {
    const resourcesTestNames = ['cpu-usage', 'ram-usage', 'disk-usage'];

    for (const name of resourcesTestNames) {
      console.log(`Checking ${name}`);
      const resourceEl: ElementFinder = await TestUtils.getElementByDataTestId(name);
      const resourceVal = parseFloat(await this.getSystemInfoValue(resourceEl));
      console.log(`${name} = ${resourceVal}`);
      expect(resourceVal).toBeGreaterThan(0);
    }
  }

  async checkMachineDetails(machineInfo) {
    await this.expandMachineDetails(machineInfo.name);

    for (const detail of Object.keys(machineInfo.machineDetails)) {
      console.log(`Checking ${detail}.`);
      const detailEl: ElementFinder = await this.getMachineDetail(detail);
      const detailValue: string = await this.getSystemInfoValue(detailEl);
      const detailActualValue: string = machineInfo.machineDetails[detail];

      console.log(`In details: ${detailValue} vs. actual: ${detailActualValue}`);

      expect(detailValue.toLowerCase()).toEqual(detailActualValue.toLowerCase());
    }

    await browser.refresh();
    await browser.sleep(1000);
  }
}
