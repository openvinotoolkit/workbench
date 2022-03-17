import { browser } from 'protractor';

import { IInferenceConfiguration } from '@shared/models/compound-inference-config';

import { TestUtils } from './pages/test-utils';
import { InferenceType } from './pages/configuration-wizard.po';
import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';
import { ComparisonPage } from './pages/comparison.po';

// 73803
xdescribe('UI tests on projects comparison', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  const modelFile = browser.params.precommit_scope.resources.classificationModels.squeezenetV1;
  const datasetFile = browser.params.precommit_scope.resources.smallVOCDataset;
  const inferenceTarget = InferenceType.CPU;
  const inferenceTargetSecond = InferenceType.GPU;
  const comparisonPage = new ComparisonPage();

  const groupInferences: IInferenceConfiguration[] = [
    { batch: 1, nireq: 1 },
    { batch: 1, nireq: 2 },
    { batch: 2, nireq: 1 },
    { batch: 2, nireq: 2 },
  ];

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

    await inferenceUtils.runGroupInferenceFromConfigurationBlock(false, groupInferences);

    await inferenceUtils.runInferenceNewTarget(modelFile.name, datasetFile, inferenceTargetSecond);
  });

  beforeEach(async () => {
    await testUtils.inferenceCard.goToComparison();
    await browser.sleep(3000);
    await LoginPage.authWithTokenOnLoginPage();
  });

  it('should select projects, check tabs', async () => {
    await comparisonPage.selectProject(
      'a',
      modelFile.name,
      datasetFile.name,
      TestUtils.targetNameFromEnum(inferenceTarget)
    );
    await comparisonPage.selectProject(
      'b',
      modelFile.name,
      datasetFile.name,
      TestUtils.targetNameFromEnum(inferenceTargetSecond)
    );
    await comparisonPage.compare();
    await comparisonPage.assertTabs();
  });

  it('should select projects, select experiments', async () => {
    await comparisonPage.selectProject(
      'a',
      modelFile.name,
      datasetFile.name,
      TestUtils.targetNameFromEnum(inferenceTarget)
    );
    await comparisonPage.selectProject(
      'b',
      modelFile.name,
      datasetFile.name,
      TestUtils.targetNameFromEnum(inferenceTargetSecond)
    );

    await comparisonPage.assertExperimentsNumber('a', groupInferences.length + 1); // Including auto benchmarking
    await comparisonPage.assertExperimentsNumber('b', 2); // Default inference (batch 1, streams 1) + auto benchmarking

    await comparisonPage.assertExperimentSelected('b', 1, 2); // For project on GPU best performance is achieved with auto benchmarking

    await comparisonPage.selectExperimentByTable('a', 2, 2);
    await comparisonPage.assertExperimentSelected('a', 2, 2);

    await comparisonPage.selectExperimentByChart('a', 1, 2);
    await comparisonPage.assertExperimentSelected('a', 1, 2);

    await comparisonPage.selectProject(
      'a',
      modelFile.name,
      datasetFile.name,
      TestUtils.targetNameFromEnum(inferenceTargetSecond)
    );
    await comparisonPage.selectProject(
      'b',
      modelFile.name,
      datasetFile.name,
      TestUtils.targetNameFromEnum(inferenceTarget)
    );

    await comparisonPage.assertExperimentsNumber('a', 2); // Default inference (batch 1, streams 1) + auto benchmarking
    await comparisonPage.assertExperimentsNumber('b', groupInferences.length + 1); // Including auto benchmarking

    await comparisonPage.assertExperimentSelected('a', 1, 2); // For project on GPU best performance is achieved with auto benchmarking

    await comparisonPage.selectExperimentByTable('b', 2, 2);
    await comparisonPage.assertExperimentSelected('b', 2, 2);

    await comparisonPage.selectExperimentByChart('b', 1, 2);
    await comparisonPage.assertExperimentSelected('b', 1, 2);
  });

  it('should select projects, validate table', async () => {
    await comparisonPage.selectProject(
      'a',
      modelFile.name,
      datasetFile.name,
      TestUtils.targetNameFromEnum(inferenceTarget)
    );
    await comparisonPage.selectProject(
      'b',
      modelFile.name,
      datasetFile.name,
      TestUtils.targetNameFromEnum(inferenceTargetSecond)
    );
    await comparisonPage.compare();
    await comparisonPage.openLayersTable();

    const layersTableEl = comparisonPage.layersTableEl;
    await browser.wait(layersTableEl.isPresent());
    const executionGraph = await testUtils.getExecGraph(layersTableEl);
    const execComparisonGraph = await testUtils.getExecGraph(layersTableEl, true);
    const irGraph = await testUtils.getIrGraph(layersTableEl);
    const table = testUtils.inferenceCard.layersTable;
    await testUtils.inferenceCard.clickFirsRow(table);

    const rowsWithError = await testUtils.inferenceCard.checkValueInLayerTable(
      table,
      executionGraph,
      irGraph,
      execComparisonGraph
    );
    expect(rowsWithError.length).toBeFalsy(`Error in row: ${rowsWithError.join(', ')}`);
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
    await comparisonPage.navigateToDashboard();
  });

  afterAll(async () => {
    await testUtils.deleteArtifacts();
    await TestUtils.getBrowserLogs();
  });
});
