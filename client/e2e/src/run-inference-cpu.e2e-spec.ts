import { browser } from 'protractor';

import { ModelPrecisionEnum } from '@store/model-store/model.model';

import { IInferenceConfiguration } from '@shared/models/compound-inference-config';

import { InferenceType } from './pages/configuration-wizard.po';
import { Frameworks, TestUtils } from './pages/test-utils';
import { Helpers } from './pages/helpers';
import { InferenceUtils } from './pages/inference-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';
import { HFModel, ModelFile } from './pages/model-file';

describe('UI tests on Running inference', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  let analyticsPopup: AnalyticsPopup;
  let helpers: Helpers;
  const datasetFileVOC = browser.params.precommit_scope.resources.VOCDataset;
  const datasetFileImageNet = browser.params.precommit_scope.resources.imageNetDataset;
  const dataSetFileCoco = browser.params.precommit_scope.resources.cocoDataset;
  const dataSetFileLFW = browser.params.precommit_scope.resources.LFWDataset;
  const dataSetFileVggFaces2 = browser.params.precommit_scope.resources.VggFaces2Dataset;
  const datasetFileOpenImages = browser.params.precommit_scope.resources.OpenImagesDataset;
  const datasetCityScapes = browser.params.precommit_scope.resources.CityscapesDataset;
  const sentimentClassificationDataset = browser.params.precommit_scope.resources.nlpDatasets.imdb;
  const toxicClassificationDataset = browser.params.precommit_scope.resources.nlpDatasets.toxicComments;
  const referenceLayerDistribution = browser.params.precommit_scope.resources.layersDistribution.resnet50Caffe2;
  const referencePrecisionDistribution = browser.params.precommit_scope.resources.precisionsDistribution.resnet50Caffe2;

  beforeAll(async () => {
    testUtils = new TestUtils();
    inferenceUtils = new InferenceUtils(testUtils);
    analyticsPopup = new AnalyticsPopup();
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();
    datasetFileVOC.name = testUtils.helpers.generateName();
    datasetFileImageNet.name = testUtils.helpers.generateName();
    dataSetFileCoco.name = testUtils.helpers.generateName();
    dataSetFileLFW.name = testUtils.helpers.generateName();
    dataSetFileVggFaces2.name = testUtils.helpers.generateName();
    datasetFileOpenImages.name = testUtils.helpers.generateName();
    sentimentClassificationDataset.name = testUtils.helpers.generateName();
    toxicClassificationDataset.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(datasetFileVOC);
    await testUtils.uploadDataset(datasetFileImageNet);
    await testUtils.uploadDataset(dataSetFileCoco);
    await testUtils.uploadDataset(dataSetFileLFW);
    await testUtils.uploadDataset(dataSetFileVggFaces2);
    await testUtils.uploadDataset(datasetFileOpenImages);
    await testUtils.uploadDataset(datasetCityScapes);
    await testUtils.configurationWizard.importNLPDataset(
      sentimentClassificationDataset,
      browser.params.precommit_scope.resource_dir
    );
    await testUtils.configurationWizard.importNLPDataset(
      toxicClassificationDataset,
      browser.params.precommit_scope.resource_dir
    );
    helpers = new Helpers();
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  it('Upload OD model, run CPU inference, check accuracy and model analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.ssdliteMobileNetV2;
    const inferenceTarget = InferenceType.CPU;

    const accuracy = await inferenceUtils.runInferencePipelineThroughUpload(modelFile, datasetFileVOC, inferenceTarget);
    // expect(+accuracy).toEqual(
    //   modelFile.accuracyData.accuracyValue,
    //   `Accuracy: ${accuracy} is not equal to expected: ${modelFile.accuracyData.accuracyValue}`
    // );
  });

  // TODO: 74929
  xit('Upload FP32 Classification model, run parallel request tuning in CPU, check accuracy', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.inceptionV3;
    modelFile.name = testUtils.helpers.generateName();
    await inferenceUtils.runInference(
      modelFile,
      datasetFileImageNet,
      InferenceType.CPU,
      browser.params.precommit_scope.resource_dir
    );

    const inferences: IInferenceConfiguration[] = [
      { batch: 2, nireq: 3 },
      { batch: 2, nireq: 5 },
      { batch: 2, nireq: 7 },
      { batch: 3, nireq: 3 },
      { batch: 3, nireq: 5 },
      { batch: 3, nireq: 7 },
      { batch: 4, nireq: 3 },
      { batch: 4, nireq: 5 },
      { batch: 4, nireq: 7 },
    ];

    const result = await inferenceUtils.runGroupInferenceFromConfigurationBlock(false, inferences);
    expect(result).toBeTruthy();

    const accuracy = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile);
    expect(accuracy).toMatch(/\d+(.\d+)?/);
  });

  // TODO: 47805
  xit('Upload FP32 Object Detection model, cancel parallel request tuning in CPU', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.ssdliteMobileNetV2;
    modelFile.name = testUtils.helpers.generateName();
    await inferenceUtils.runInference(
      modelFile,
      datasetFileVOC,
      InferenceType.CPU,
      browser.params.precommit_scope.resource_dir
    );

    const inferences: IInferenceConfiguration[] = [
      { batch: 2, nireq: 3 },
      { batch: 2, nireq: 5 },
      { batch: 2, nireq: 7 },
      { batch: 3, nireq: 3 },
      { batch: 3, nireq: 5 },
      { batch: 3, nireq: 7 },
      { batch: 4, nireq: 3 },
      { batch: 4, nireq: 5 },
      { batch: 4, nireq: 7 },
    ];

    const result = await inferenceUtils.runGroupInferenceFromConfigurationBlock(true, inferences);
    expect(result).toBeTruthy();

    const accuracy = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile);
    expect(accuracy).toMatch(/\d+(.\d+)?/);
  });

  xit('should upload OD Caffe model, convert, run CPU inference, check accuracy and model analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.mobilenet;
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, datasetFileVOC, inferenceTarget);
  });

  it('should upload Classification Caffe model, convert, run CPU inference, check info, check advise', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.squeezenetV1;
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, datasetFileImageNet, inferenceTarget);

    // Check advising logic
    await testUtils.clickElement(testUtils.inferenceCard.analyzeTab);
    await browser.sleep(700);
    await testUtils.clickElement(testUtils.inferenceCard.performanceSubTab);
    await browser.sleep(700);

    const adviceCheckingParams = {
      adviceLevel: 0,
      isTheoryPresent: true,
      numberOfAdviceContainers: 1,
      adviceId: 'calibrateFirst',
    };

    expect(await testUtils.inferenceCard.checkAdvice(adviceCheckingParams)).toBeTruthy(
      'Advising container check failed.'
    );
  });

  it('should upload Classification ONNX model, convert, run CPU inference, check info', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.inceptionV2;
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, datasetFileImageNet, inferenceTarget);
  });

  it('should upload Classification TF frozen model, convert, run CPU inference, check info', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.inceptionV3TF;
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, datasetFileImageNet, inferenceTarget);
  });

  xit('should upload OD MxNet model, convert, run CPU inference, check info', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.SSDMobilenet;
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, datasetFileVOC, inferenceTarget);
  });

  xit('Upload OD model, run CPU inference, measure accuracy, edit and re-check accuracy', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.mobilenet;
    const inferenceTarget = InferenceType.CPU;
    const currentAccuracy = await inferenceUtils.runInferencePipelineThroughUpload(
      modelFile,
      datasetFileVOC,
      inferenceTarget
    );
    console.log('Current accuracy:' + currentAccuracy);

    console.log('Edit Overlap');
    const projectSelector = testUtils
      .topLevelProjectSelector(modelFile.name, datasetFileVOC.name, inferenceTarget)
      .bind(testUtils);
    await testUtils.editOverlapThresholdAndSave(await projectSelector(), '0.51');

    console.log('Wait recheck');
    const accuracyResult = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile);

    console.log('Accuracy check finish:' + accuracyResult);
    expect(Number(accuracyResult) >= 0).toBeTruthy();
  });

  it('Upload model, run inference, check layers and precision in inference data table', async () => {
    const model = { name: 'squeezenet1.0', framework: Frameworks.CAFFE };
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughDownloader(
      model,
      datasetFileImageNet,
      inferenceTarget,
      null,
      ModelPrecisionEnum.FP32,
      true
    );

    await browser.wait(testUtils.until.presenceOf(testUtils.inferenceCard.kernelRibbon));
    await testUtils.clickElement(testUtils.inferenceCard.kernelRibbon);

    await browser.wait(testUtils.until.presenceOf(testUtils.inferenceCard.inferDataTable));

    const executionGraph = await testUtils.getExecGraph(testUtils.inferenceCard.inferDataTable);
    const table = await testUtils.inferenceCard.layersTable;

    await browser.sleep(2000);

    const unExpectedRows = await testUtils.inferenceCard.layersPresentInInferenceTable(table, executionGraph);
    expect(unExpectedRows.length === 0).toBeTruthy(`Rows not found: ${unExpectedRows.join(', ')}`);

    const resultEqualPrecision: string[] = await testUtils.inferenceCard.equalPrecisionLayerAndTable(
      table,
      executionGraph
    );
    expect(resultEqualPrecision.length === 0).toBeTruthy(
      `Rows there precision not equal: ${resultEqualPrecision.join(', ')}`
    );
  });

  it('Equal value in layers-table and in model graph', async () => {
    const model = { name: 'squeezenet1.0', framework: Frameworks.CAFFE };
    const inferenceTarget = InferenceType.CPU;
    const inferenceResult = await inferenceUtils.runInferencePipelineThroughDownloader(
      model,
      datasetFileImageNet,
      inferenceTarget,
      null,
      ModelPrecisionEnum.FP32,
      true
    );

    if (inferenceResult) {
      await browser.wait(testUtils.until.presenceOf(testUtils.inferenceCard.kernelRibbon));
      await testUtils.clickElement(testUtils.inferenceCard.kernelRibbon);

      await browser.wait(testUtils.until.presenceOf(testUtils.inferenceCard.inferDataTable));

      const executionGraph = await testUtils.getExecGraph(testUtils.inferenceCard.inferDataTable);
      const irGraph = await testUtils.getIrGraph(testUtils.inferenceCard.inferDataTable);
      const table = await testUtils.inferenceCard.layersTable;

      await testUtils.inferenceCard.clickFirsRow(table);

      const rowsWithError = await testUtils.inferenceCard.checkValueInLayerTable(table, executionGraph, irGraph);
      await expect(rowsWithError.length === 0).toBeTruthy(`Error in rows: ${rowsWithError.join(', ')}`);
    }
  });

  it('Upload OD Coco model, check accuracy', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.ssdMobilenetCoco;
    modelFile.name = testUtils.helpers.generateName();
    await inferenceUtils.runInference(
      modelFile,
      dataSetFileCoco,
      InferenceType.CPU,
      browser.params.precommit_scope.resource_dir
    );

    const accuracy = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile);
    expect(+accuracy).toEqual(
      modelFile.accuracyData.accuracyValue,
      `Accuracy: ${accuracy} is not equal to expected: ${modelFile.accuracyData.accuracyValue}`
    );
  });

  it('Should upload facenet model, run inference', async () => {
    const modelFile = browser.params.precommit_scope.resources.faceRecognition.facenet;
    modelFile.name = testUtils.helpers.generateName();
    await inferenceUtils.runInference(
      modelFile,
      dataSetFileLFW,
      InferenceType.CPU,
      browser.params.precommit_scope.resource_dir
    );
  });

  it('Should upload Landmark Detection landmarksRegressionRetail model', async () => {
    const modelFile = browser.params.precommit_scope.resources.landmarkDetection.landmarksRegressionRetail;
    modelFile.name = testUtils.helpers.generateName();
    await inferenceUtils.runInference(
      modelFile,
      dataSetFileVggFaces2,
      InferenceType.CPU,
      browser.params.precommit_scope.resource_dir
    );
  });

  it('should upload FP32 IR V11 model, run CPU inference, check accuracy and model analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.squeezenetIRV11;
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, datasetFileImageNet, inferenceTarget);
  });

  // 73802
  xit('should upload Classification INT8 IR V10 model, run CPU inference, check accuracy and model analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.squeezenetINT8;
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, datasetFileImageNet, inferenceTarget);
  });

  it('Upload FP16 IR V11 model, run parallel request tuning in CPU, check accuracy', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.squeezenetIRV11;
    modelFile.name = testUtils.helpers.generateName();
    await inferenceUtils.runInference(
      modelFile,
      datasetFileImageNet,
      InferenceType.CPU,
      browser.params.precommit_scope.resource_dir
    );

    const inferences: IInferenceConfiguration[] = [
      { batch: 2, nireq: 3 },
      { batch: 2, nireq: 5 },
      { batch: 2, nireq: 7 },
      { batch: 3, nireq: 3 },
      { batch: 3, nireq: 5 },
      { batch: 3, nireq: 7 },
      { batch: 4, nireq: 3 },
      { batch: 4, nireq: 5 },
      { batch: 4, nireq: 7 },
    ];

    const result = await inferenceUtils.runGroupInferenceFromConfigurationBlock(false, inferences);
    expect(result).toBeTruthy();

    const accuracy = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile);
    expect(+accuracy).toEqual(
      modelFile.accuracyData.accuracyValue,
      `Accuracy: ${accuracy} is not equal to expected: ${modelFile.accuracyData.accuracyValue}`
    );
  });

  it('Should upload TF Classification model with NCHW layout, run CPU inference, check accuracy and model analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.SampleNet;
    modelFile.name = helpers.generateName();
    await testUtils.modelManagerPage.selectUploadModelTab();
    await testUtils.modelManagerPage.uploadTensorFlowModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, 0);
  });

  it('Should upload Grayscale Text Recognition model, run CPU inference and analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.textRecognition.ResNetGray;
    modelFile.name = helpers.generateName();
    await testUtils.modelManagerPage.selectUploadModelTab();
    await testUtils.modelManagerPage.uploadOnnxModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, 0);
  });

  // TODO 62219
  xit('Should upload Open Images OD model, run CPU inference and analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.SSSMobilenetV2OID;
    modelFile.name = helpers.generateName();
    await testUtils.modelManagerPage.selectUploadModelTab();
    await testUtils.modelManagerPage.uploadTensorFlowModel(modelFile, browser.params.precommit_scope.resource_dir);
    await testUtils.checkModelAndCleanUp(modelFile, 0);
  });

  // TODO: 69327
  xit('Upload efficientDet, run CPU inference, check accuracy and model analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.efficientDet;
    const inferenceTarget = InferenceType.CPU;

    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, dataSetFileCoco, inferenceTarget);
  });

  // TODO: 56041
  xit('Upload Tapway, run CPU inference, check accuracy and model analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.tapway;
    const inferenceTarget = InferenceType.CPU;

    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, dataSetFileCoco, inferenceTarget);
  });

  // 77337
  xit('Upload yolo-v3-tiny, run CPU inference, check accuracy and model analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.yoloV3TinyIR;
    const inferenceTarget = InferenceType.CPU;

    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, dataSetFileCoco, inferenceTarget);
  });

  // 77337
  xit('Upload yolo-v3, run CPU inference, check accuracy and model analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.yoloV3IR;
    const inferenceTarget = InferenceType.CPU;

    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, dataSetFileCoco, inferenceTarget);
  });

  // 77337
  xit('Upload yolo-v4-tiny, run CPU inference, check accuracy and model analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.yoloV4TinyIR;
    const inferenceTarget = InferenceType.CPU;

    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, dataSetFileCoco, inferenceTarget);
  });

  // 77337
  xit('Upload yolo-v4, run CPU inference, check accuracy and model analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.yoloV4IR;
    const inferenceTarget = InferenceType.CPU;

    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, dataSetFileCoco, inferenceTarget);
  });

  // 78628
  xit('should run CPU inference on semantic segmentation model with CityScapes dataset', async () => {
    const model = { name: 'deeplabv3' };
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughDownloader(
      model,
      datasetCityScapes,
      inferenceTarget,
      null,
      ModelPrecisionEnum.FP16,
      true,
      false,
      false
    );
  });

  it('should download an NLP model from HF, run inference', async () => {
    const model: HFModel = browser.params.precommit_scope.resources.HFModels.ms_marco_MiniLM_L_12_v2;
    const inferenceTarget = InferenceType.CPU;
    await testUtils.HFModelDownloadPage.selectDownloadConvertModel(model);
    await inferenceUtils.runInferenceOnDownloadedModel(model.name, sentimentClassificationDataset, inferenceTarget);
    await testUtils.checkExecutionAttributes();
  });

  // 76484
  xit('should upload dynamic model, run CPU inference, check accuracy and model analysis', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.squeezenetDynamicShapes;
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughUpload(modelFile, datasetFileImageNet, inferenceTarget);
  });

  it('should upload IR NLP classification model, run CPU inference, check the metrics', async () => {
    const modelFile = browser.params.precommit_scope.resources.nlpModels.distilbertEmotion;
    const inferenceTarget = InferenceType.CPU;
    modelFile.name = testUtils.helpers.generateName();
    await inferenceUtils.runInference(
      modelFile,
      sentimentClassificationDataset,
      inferenceTarget,
      browser.params.precommit_scope.resource_dir
    );
    await testUtils.checkExecutionAttributes();
  });

  it(
    'should upload ONNX NLP classification model & convert with the NC layout, ' + 'run inference, check metrics',
    async () => {
      const modelFile: ModelFile = browser.params.precommit_scope.resources.nlpModels.toxicBert;
      const inferenceTarget = InferenceType.CPU;

      // Change to the NC layout
      const newLayout = ['Batch', 'Channels'];
      for (let idx = 0, len = modelFile.conversionSettings.inputLayers.length; idx < len; idx++) {
        modelFile.conversionSettings.inputLayers[idx].originalLayout = newLayout;
      }

      modelFile.name = testUtils.helpers.generateName();

      // Upload model
      await testUtils.modelManagerPage.selectUploadModelTab();
      await inferenceUtils.uploadModelByFramework(modelFile, browser.params.precommit_scope.resource_dir);

      await console.log('Upload is ready');
      await testUtils.configurationWizard.waitForModelsRows();

      await testUtils.configurationWizard.checkModelType(modelFile.name);

      // Run inference
      await testUtils.homePage.openConfigurationWizard();
      await testUtils.configurationWizard.selectModelForInference(modelFile.name);
      testUtils.uploadedModels.push(modelFile.name);
      console.log(`Uploaded model: ${modelFile.name}`);

      await testUtils.configurationWizard.selectDatasetRow(toxicClassificationDataset);

      await testUtils.configurationWizard.runInference(inferenceTarget, false);
      console.log('GO (inference) button clicked');

      await testUtils.inferenceCard.waitForInferenceOverlay();
      await testUtils.waitForProjectToBeReady();

      await testUtils.checkExecutionAttributes();
    }
  );

  it('should upload ONNX NLP classification model, upload tokenizer, run inference, check metrics', async () => {
    const modelFile: ModelFile = browser.params.precommit_scope.resources.nlpModels.toxicBert;
    const inferenceTarget = InferenceType.CPU;
    modelFile.name = testUtils.helpers.generateName();

    // Upload model
    await testUtils.modelManagerPage.selectUploadModelTab();
    await inferenceUtils.uploadModelByFramework(modelFile, browser.params.precommit_scope.resource_dir);

    await console.log('Upload is ready');
    await testUtils.configurationWizard.waitForModelsRows();

    await testUtils.configurationWizard.checkModelType(modelFile.name);

    // Upload tokenizer
    await testUtils.uploadTokenizer(modelFile);

    // Run inference
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.configurationWizard.selectModelForInference(modelFile.name);
    testUtils.uploadedModels.push(modelFile.name);
    console.log(`Uploaded model: ${modelFile.name}`);

    await testUtils.configurationWizard.selectDatasetRow(toxicClassificationDataset);

    await testUtils.configurationWizard.runInference(inferenceTarget, false);
    console.log('GO (inference) button clicked');

    await testUtils.inferenceCard.waitForInferenceOverlay();
    await testUtils.waitForProjectToBeReady();

    await testUtils.checkExecutionAttributes();
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await testUtils.deleteUploadedModels();
    await testUtils.uploadedModels.pop();
    await TestUtils.getBrowserLogs();
  });

  afterAll(async () => {
    await testUtils.deleteUploadedDatasets();
    await TestUtils.getBrowserLogs();
  });
});
