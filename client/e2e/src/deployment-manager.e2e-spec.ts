import { browser } from 'protractor';

import { OSTypeNames } from '@shared/models/device';

import { InferenceType } from './pages/configuration-wizard.po';
import { TestUtils } from './pages/test-utils';
import { InferenceUtils } from './pages/inference-utils';
import { PackingModel } from './pages/packaging.po';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';

describe('UI tests on Packing project.', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  let analyticsPopup: AnalyticsPopup;
  const datasetFileImageNet = browser.params.precommit_scope.resources.smallVOCDataset;
  const modelFile = browser.params.precommit_scope.resources.ODModels.ssdliteMobileNetV2;
  const inferenceTarget = InferenceType.CPU;

  beforeAll(async () => {
    testUtils = new TestUtils();
    inferenceUtils = new InferenceUtils(testUtils);
    analyticsPopup = new AnalyticsPopup();
    datasetFileImageNet.name = testUtils.helpers.generateName();
    await testUtils.homePage.navigateTo();
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.uploadDataset(datasetFileImageNet);
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, datasetFileImageNet, inferenceTarget);
  });

  beforeEach(async () => {
    await browser.sleep(1000);
    await browser.refresh();
  });

  it('Select only CPU, model not include', async () => {
    const packingModel = new PackingModel();
    packingModel.CPU = true;
    await testUtils.loadPack(packingModel);
  });

  it('Select only GPU, model not include', async () => {
    const packingModel = new PackingModel();
    packingModel.GPU = true;
    await testUtils.loadPack(packingModel);
  });

  it('Select CPU and GPU, model not include', async () => {
    const packingModel = new PackingModel();
    packingModel.CPU = true;
    packingModel.GPU = true;
    await testUtils.loadPack(packingModel);
  });

  it('Select only CPU, model include', async () => {
    const packingModel = new PackingModel();
    packingModel.CPU = true;
    packingModel.includeModel = true;
    await testUtils.loadPack(packingModel, modelFile.name);
  });

  it('Select only GPU, model include', async () => {
    const packingModel = new PackingModel();
    packingModel.GPU = true;
    packingModel.includeModel = true;
    await testUtils.loadPack(packingModel, modelFile.name);
  });

  it('Select CPU and GPU, model include', async () => {
    const packingModel = new PackingModel();
    packingModel.CPU = true;
    packingModel.GPU = true;
    packingModel.includeModel = true;
    await testUtils.loadPack(packingModel, modelFile.name);
  });

  it('should select CPU and GPU, model include, select Ubuntu 20, export project', async () => {
    const packingModel = new PackingModel();
    packingModel.CPU = true;
    packingModel.GPU = true;
    packingModel.includeModel = true;
    packingModel.os = OSTypeNames.UBUNTU20;
    packingModel.baseName = `${OSTypeNames.UBUNTU20}_deployment_package_`;
    await testUtils.loadPack(packingModel, modelFile.name);
  });

  afterEach(async () => {
    await TestUtils.getBrowserLogs();
  });

  afterAll(async () => {
    await testUtils.deleteUploadedModels();
    await testUtils.uploadedModels.pop();
    await testUtils.deleteUploadedDatasets();
    await TestUtils.getBrowserLogs();
  });
});
