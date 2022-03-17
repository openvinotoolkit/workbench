import { browser } from 'protractor';

import { IInferenceConfiguration } from '@shared/models/compound-inference-config';

import { TestUtils } from './pages/test-utils';
import { InferenceType } from './pages/configuration-wizard.po';
import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';

describe('UI tests for inference configuration', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  const modelFile = browser.params.precommit_scope.resources.ODModels.ssdliteMobileNetV2;
  const datasetFile = browser.params.precommit_scope.resources.smallVOCDataset;
  const inferenceTarget = InferenceType.CPU;

  beforeAll(async () => {
    testUtils = new TestUtils();
    inferenceUtils = new InferenceUtils(testUtils);
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await testUtils.homePage.openConfigurationWizard();
    datasetFile.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(datasetFile);
    await testUtils.modelManagerPage.goToModelManager();

    await inferenceUtils.runInference(
      modelFile,
      datasetFile,
      inferenceTarget,
      browser.params.precommit_scope.resource_dir
    );
  });

  beforeEach(async () => {
    await testUtils.inferenceCard.goToConfigureInferencePage();
    await browser.sleep(3000);
    await LoginPage.authWithTokenOnLoginPage();
  });

  it('should configure inferences and check selection table', async function () {
    const inferences: IInferenceConfiguration[] = [
      { batch: 1, nireq: 2 },
      { batch: 1, nireq: 3 },
      { batch: 1, nireq: 4 },
    ];
    await testUtils.inferenceConfigurationPage.selectInferences(inferences);
    expect(await testUtils.inferenceConfigurationPage.isAllInferencesInSelectedTable(inferences)).toBeTruthy();
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
    await testUtils.inferenceConfigurationPage.backToDashboard();
  });

  afterAll(async () => {
    await testUtils.deleteArtifacts();
    await TestUtils.getBrowserLogs();
  });
});
