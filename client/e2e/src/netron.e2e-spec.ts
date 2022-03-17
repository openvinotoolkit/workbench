import { browser } from 'protractor';

import { ModelGraphType, ModelPrecisionEnum } from '@store/model-store/model.model';

import { GraphColoringLabels, GraphFormatsToDownload } from '@shared/models/netron';

import { InferenceType } from './pages/configuration-wizard.po';
import { Frameworks, TestUtils } from './pages/test-utils';
import { InferenceUtils } from './pages/inference-utils';

export interface NetronLayer {
  name: string;
  type: string;
  data: object;
}

describe('UI tests on Netron Visualization', () => {
  const testUtils = new TestUtils();
  const inferenceUtils = new InferenceUtils(testUtils);
  const datasetFileImageNet = browser.params.precommit_scope.resources.imageNetDataset;
  const model = { name: 'squeezenet1.0', framework: Frameworks.CAFFE };
  const inferenceTarget = InferenceType.CPU;

  beforeAll(async () => {
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.uploadDataset(datasetFileImageNet);
    await testUtils.modelManagerPage.goToModelManager();
    await inferenceUtils.runInferencePipelineThroughDownloader(
      model,
      datasetFileImageNet,
      inferenceTarget,
      null,
      ModelPrecisionEnum.FP32,
      true
    );
  });

  beforeEach(async () => {
    await testUtils.homePage.openProjectByModelAndDatasetNames(model.name, datasetFileImageNet.name);

    await testUtils.clickElement(testUtils.inferenceCard.analyzeTab);
    await browser.sleep(500);

    await browser.wait(testUtils.until.presenceOf(testUtils.inferenceCard.kernelRibbon));
    console.log('Kernel ribbon is displaying');
    await testUtils.clickElement(testUtils.inferenceCard.kernelRibbon);
    console.log('Click kernel');
    await browser.sleep(500);
    const runtimeSvgElement = await testUtils.netronGraph.getNetronGraphSvgElement(ModelGraphType.RUNTIME);
    await browser.wait(testUtils.until.presenceOf(runtimeSvgElement));
    await testUtils.clickButton('visualize-ir-button');
    await browser.sleep(500);
    const originalSvgElement = await testUtils.netronGraph.getNetronGraphSvgElement(ModelGraphType.ORIGINAL);
    await browser.wait(testUtils.until.presenceOf(originalSvgElement));
  });

  it('should check that Netron graphs are rendered correctly', async () => {
    const executionGraph = (await testUtils.getExecGraph(testUtils.inferenceCard.inferDataTable)) as NetronLayer[];
    const runtimeResult = await testUtils.netronGraph.areLayersPresentInNetronGraph(
      executionGraph,
      ModelGraphType.RUNTIME
    );
    expect(runtimeResult).toBeTruthy('Runtime graph is not rendered correctly');

    const originalGraph: NetronLayer[] = await testUtils
      .getIrGraph(testUtils.inferenceCard.inferDataTable)
      .then((graph: NetronLayer[]) => graph.filter((layer) => layer.type !== 'Const'));
    const originalResult = await testUtils.netronGraph.areLayersPresentInNetronGraph(
      originalGraph,
      ModelGraphType.ORIGINAL
    );
    expect(originalResult).toBeTruthy('Original graph is not rendered correctly');

    const defaultLayersResult = await testUtils.netronGraph.compareRuntimeSelectedLayers();
    expect(defaultLayersResult).toBeTruthy('Default selected layers are not equal');
  });

  it('should check download functional in graphs', async () => {
    for (const format of [ModelGraphType.RUNTIME, ModelGraphType.ORIGINAL]) {
      const isPngFilePresent = await testUtils.netronGraph.checkDownloadFunctional(
        format,
        model.name,
        GraphFormatsToDownload.PNG
      );
      expect(isPngFilePresent).toBeTruthy('Png file was not downloaded.');
      await testUtils.deleteFile(model.name, GraphFormatsToDownload.PNG);

      await browser.sleep(1000);

      const isSvgFilePresent = await testUtils.netronGraph.checkDownloadFunctional(
        format,
        model.name,
        GraphFormatsToDownload.SVG
      );
      expect(isSvgFilePresent).toBeTruthy('Svg file was not downloaded.');
      await testUtils.deleteFile(model.name, GraphFormatsToDownload.SVG);
    }
  });

  it('should check coloring and search functional in graphs', async () => {
    const searchResult = await testUtils.netronGraph.checkSearchFunctional(ModelGraphType.RUNTIME);
    expect(searchResult).toBeTruthy('Search functional doesn`t work correctly in runtime graph');

    const timeColoringResult = await testUtils.netronGraph.checkColoringFunctional(
      ModelGraphType.RUNTIME,
      GraphColoringLabels.BY_EXECUTION_TIME
    );
    expect(timeColoringResult).toBeTruthy(`Coloring ${GraphColoringLabels.BY_EXECUTION_TIME} doesn't work correctly`);

    const runtimePrecisionColoringResult = await testUtils.netronGraph.checkColoringFunctional(
      ModelGraphType.RUNTIME,
      GraphColoringLabels.BY_RUNTIME_PRECISION
    );
    expect(runtimePrecisionColoringResult).toBeTruthy(
      `Coloring ${GraphColoringLabels.BY_RUNTIME_PRECISION} Coloring doesn't work correctly`
    );

    const outputPrecisionColoringResult = await testUtils.netronGraph.checkColoringFunctional(
      ModelGraphType.ORIGINAL,
      GraphColoringLabels.BY_OUTPUT_PRECISION
    );
    expect(outputPrecisionColoringResult).toBeTruthy(
      `Coloring ${GraphColoringLabels.BY_OUTPUT_PRECISION} doesn't work correctly`
    );
  });

  it('should check that tracking between table and graphs is worked currectly', async () => {
    const originalGraph = (await testUtils.getIrGraph(testUtils.inferenceCard.inferDataTable)) as NetronLayer[];

    const runtimeTestLayer: NetronLayer = await testUtils
      .getExecGraph(testUtils.inferenceCard.inferDataTable)
      .then((execGraph: NetronLayer[]) =>
        execGraph.find((layer) => layer.name === testUtils.netronGraph.testLayerName)
      );
    const originalTestLayers = await testUtils.inferenceCard.getIrLayers(runtimeTestLayer, originalGraph);
    const trackingResult = await testUtils.netronGraph.checkTrackingFunctional(originalTestLayers);
    expect(trackingResult).toBeTruthy('Tracking is not worked correctly');
  });

  it('should check that layer properties are validated', async () => {
    const runtimeSvgElement = await testUtils.netronGraph.getNetronGraphSvgElement(ModelGraphType.RUNTIME);
    await testUtils.netronGraph.selectLayerCellInTable(testUtils.netronGraph.testLayerName);
    await browser.sleep(500);

    const selectedLayer = testUtils.netronGraph.getNetronNodeElements(
      runtimeSvgElement,
      testUtils.netronGraph.selectLayerClass
    );
    const detailsButton = testUtils.netronGraph.getDetailsLayerButton(selectedLayer.first());
    await testUtils.clickElement(detailsButton);
    await browser.sleep(500);

    const runtimeGraph = await testUtils.getExecGraph(testUtils.inferenceCard.inferDataTable);
    const runtimeTestLayer = (runtimeGraph as NetronLayer[]).find(
      (layer) => layer.name === testUtils.netronGraph.testLayerName
    );

    console.log('layer property panel is opened');
    await testUtils.netronGraph.validateLayerProperties(runtimeTestLayer);
  });

  afterAll(async () => {
    await testUtils.deleteUploadedModels();
    await testUtils.uploadedModels.pop();
    await testUtils.deleteUploadedDatasets();
    await TestUtils.getBrowserLogs();
  });
});
