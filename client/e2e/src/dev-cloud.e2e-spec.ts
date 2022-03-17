import { browser, ElementFinder } from 'protractor';

import { OptimizationAlgorithm, OptimizationAlgorithmPreset } from '@store/project-store/project.model';

import { CpuPlatformType, CpuPlatformTypeNamesMap } from '@shared/models/pipelines/target-machines/target-machine';

import { LoginPage } from './pages/login.po';
import { Frameworks, TestUtils } from './pages/test-utils';
import { AnalyticsPopup } from './pages/analytics-popup.po';
import { ConfigurationWizardPage, InferenceType } from './pages/configuration-wizard.po';
import { TargetMachines, DevCloudTargets } from './pages/target-machines.po';
import { InferenceUtils } from './pages/inference-utils';
import { CalibrationUtils } from './pages/calibration-utils';
import { Helpers } from './pages/helpers';

describe('Dev Cloud E2E tests', () => {
  const testUtils: TestUtils = new TestUtils();
  const inferenceUtils = new InferenceUtils();
  const analyticsPopup = new AnalyticsPopup();
  const configurationWizard: ConfigurationWizardPage = new ConfigurationWizardPage();
  const targetMachines: TargetMachines = new TargetMachines();
  const calibrationUtils = new CalibrationUtils();
  const datasetFileImageNet = browser.params.precommit_scope.resources.smallImageNetDataset;
  let minTargetMachines;
  let coreTag;

  beforeAll(async () => {
    minTargetMachines = 0;
    coreTag = 'Local Workstation';
    await Helpers.setDevCloudCookies(browser.params.devCloudCookies);

    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();

    if (browser.params.isDevCloud) {
      minTargetMachines = 1;
      coreTag = DevCloudTargets.CORE;
      datasetFileImageNet.name = testUtils.helpers.generateName();
      await testUtils.uploadDataset(datasetFileImageNet);
      jasmine.DEFAULT_TIMEOUT_INTERVAL *= 2.5;
    }
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
  });

  it('Open configuration wizard, check devices', async () => {
    await configurationWizard.selectEnvironmentStage();

    console.log('Check targets');
    if (browser.params.isDevCloud) {
      await configurationWizard.selectTargetRibbon();
    }
    expect(await targetMachines.countTargets()).toBeGreaterThan(minTargetMachines);

    console.log('Check platforms');
    await configurationWizard.selectPlatformRibbon();
    const platformSelect: ElementFinder = await configurationWizard.basePlatformSelect();

    console.log('Selecting base platform from dropdown');
    const platformSelectDisabledAttribute = await platformSelect.getAttribute('ng-reflect-disabled');
    const isBasePlatformSelectDisabled = platformSelectDisabledAttribute === 'true';
    console.log(`Base platform select disabled state: ${isBasePlatformSelectDisabled}`);
    if (isBasePlatformSelectDisabled) {
      await configurationWizard.selectValueFromDropdown(platformSelect, CpuPlatformTypeNamesMap[CpuPlatformType.CORE]);
    }

    console.log('Check Intel Core table');
    let targetRow: ElementFinder = await targetMachines.getCellByPlatformTag(coreTag);
    expect(await targetRow.isPresent()).toBeTruthy();

    if (browser.params.isDevCloud) {
      console.log('Check Intel Xenon table');
      await configurationWizard.selectValueFromDropdown(platformSelect, CpuPlatformTypeNamesMap[CpuPlatformType.XEON]);
      targetRow = await targetMachines.getCellByPlatformTag(DevCloudTargets.XEON);
      expect(await targetRow.isPresent()).toBeTruthy();

      console.log('Check Intel Atom table');
      await configurationWizard.selectValueFromDropdown(platformSelect, CpuPlatformTypeNamesMap[CpuPlatformType.ATOM]);
      targetRow = await targetMachines.getCellByPlatformTag(DevCloudTargets.ATOM);
      expect(await targetRow.isPresent()).toBeTruthy();
    }
  });

  it('Select caffe model from table, download it, run inference', async () => {
    if (!browser.params.isDevCloud) {
      return;
    }

    const model = { name: 'mobilenet-v2', framework: Frameworks.CAFFE };
    const inferenceTarget = InferenceType.CPU;
    const targetRow: ElementFinder = await targetMachines.getCellByPlatformTag(coreTag);
    await testUtils.modelManagerPage.goToModelManager();
    await inferenceUtils.runInferencePipelineThroughDownloader(
      model,
      datasetFileImageNet,
      inferenceTarget,
      null,
      null,
      true,
      targetRow
    );
  });

  it('Select mobilenet-v2 from OMZ, ImageNet dataset, infer (CPU) and int8 accuracy type', async () => {
    if (!browser.params.isDevCloud) {
      return;
    }

    const model = { name: 'mobilenet-v2', framework: Frameworks.CAFFE };
    const inferenceTarget = InferenceType.CPU;

    await testUtils.modelManagerPage.goToModelManager();

    await calibrationUtils.runInt8PipelineThroughDownloader(
      model,
      datasetFileImageNet,
      inferenceTarget,
      undefined,
      OptimizationAlgorithm.DEFAULT,
      10,
      OptimizationAlgorithmPreset.PERFORMANCE,
      10,
      undefined,
      browser.params.isDevCloud
    );
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });
});
