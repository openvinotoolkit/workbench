import { browser, by, element, ElementFinder, protractor } from 'protractor';

import { TestUtils } from './test-utils';
import { ConfigurationWizardPage } from './configuration-wizard.po';

const path = require('path');

export class AddRemoteMachinePo {
  until = protractor.ExpectedConditions;
  configurationWizard: ConfigurationWizardPage;

  constructor() {
    this.configurationWizard = new ConfigurationWizardPage();
  }

  get hostName() {
    return element(by.id('execute-btn'));
  }

  get portField() {
    return element(by.id('port'));
  }

  get targetName() {
    return element(by.id('name'));
  }

  get userName() {
    return element(by.id('username'));
  }

  get useProxy() {
    return element(by.id('useProxy'));
  }

  get useHTTPProxy() {
    return element(by.id('httpProxy'));
  }

  get hostHTTP() {
    return element(by.id('host-http'));
  }

  get portHTTP() {
    return element(by.id('port-http'));
  }

  get passwordHTTPCheckbox() {
    return element(by.id('httpProxyPasswordRequired'));
  }

  get usernameHTTPS() {
    return element(by.id('username-https'));
  }

  get passwordHTTPS() {
    return element(by.id('password-https'));
  }

  get useHTTPSProxy() {
    return element(by.id('httpsProxy'));
  }

  get passwordHTTPSCheckbox() {
    return element(by.id('httpsProxyPasswordRequired'));
  }

  get sshKey() {
    return element(by.id('file-upload-field-id'));
  }

  get saveTarget() {
    return TestUtils.getElementByDataTestId('save-target');
  }

  get cancelButton() {
    return TestUtils.getElementByDataTestId('cancel');
  }

  async makeFileInputVisible(fileType) {
    await browser.executeScript('arguments[0].style.display = "block"', fileType.getWebElement());
  }

  async fillInput(fieldName: string, inputText: string) {
    const el: ElementFinder = element(by.id(fieldName));
    await browser.wait(this.until.visibilityOf(el), browser.params.defaultTimeout);
    await el.clear();
    await el.sendKeys(inputText);
    await browser.sleep(500);
  }

  async uploadSSHKey(sshFilePath, resourceDir) {
    await this.makeFileInputVisible(this.sshKey);
    await browser.wait(this.until.visibilityOf(this.sshKey), browser.params.defaultTimeout);
    const sshFileAbsolutePath = path.resolve(__dirname, resourceDir + sshFilePath);
    await this.sshKey.sendKeys(sshFileAbsolutePath);
    await browser.sleep(1000);
  }

  async populateMachineInfo(machineInfo) {
    // Populating machine info fields
    await this.fillInput('host', browser.params.remoteMachine);
    await this.fillInput('port', machineInfo.port);
    await this.fillInput('name', machineInfo.name);
    await this.fillInput('username', machineInfo.user);

    await this.uploadSSHKey(machineInfo.sshKey, browser.params.precommit_scope.resource_dir);

    if (machineInfo.hasProxy) {
      // Populating proxy settings
      await new TestUtils().clickElement(this.useProxy);
      // HTTP
      await new TestUtils().clickElement(this.useHTTPProxy);
      await this.fillInput('host-http', browser.params.proxyHost);
      await this.fillInput('port-http', browser.params.proxyPort);
      // HTTPS
      await new TestUtils().clickElement(this.useHTTPSProxy);
      await this.fillInput('host-https', browser.params.proxyHost);
      await this.fillInput('port-https', browser.params.proxyPort);
    }

    await console.log('Machine info is populated.');
  }

  async addRemoteMachine(machineInfo) {
    await new TestUtils().clickButton('add-machine');

    await this.populateMachineInfo(machineInfo);

    await new TestUtils().clickElement(this.saveTarget);
  }
}
