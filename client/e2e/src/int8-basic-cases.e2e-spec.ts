import { browser } from 'protractor';

import { OptimizationAlgorithm, OptimizationAlgorithmPreset } from '@store/project-store/project.model';

import { InferenceType } from './pages/configuration-wizard.po';
import { Frameworks, TestUtils } from './pages/test-utils';
import { CalibrationUtils } from './pages/calibration-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';

describe('UI tests on Running Int8 Calibration', () => {
  let testUtils: TestUtils;
  let calibrationUtils: CalibrationUtils;
  let analyticsPopup: AnalyticsPopup;
  const datasetFileVOC = browser.params.precommit_scope.resources.smallVOCDataset;
  const datasetFileImageNet = browser.params.precommit_scope.resources.smallImageNetDataset;
  const datasetWiderFace = browser.params.precommit_scope.resources.WiderFaceDataset;
  const notAnnotatedDataset = browser.params.precommit_scope.resources.imageNetNotAnnotated;
  // 73948
  // const datasetCityScapes = browser.params.precommit_scope.resources.CityscapesDataset;

  beforeAll(async () => {
    testUtils = new TestUtils();
    calibrationUtils = new CalibrationUtils(testUtils);
    analyticsPopup = new AnalyticsPopup();
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();
    datasetFileVOC.name = testUtils.helpers.generateName();
    datasetFileImageNet.name = testUtils.helpers.generateName();
    notAnnotatedDataset.name = testUtils.helpers.generateName();
    await testUtils.uploadDataset(datasetFileVOC);
    await testUtils.uploadDataset(datasetFileImageNet);
    await testUtils.uploadDataset(datasetWiderFace);
    await testUtils.uploadDataset(notAnnotatedDataset);
    // 73948
    // await testUtils.uploadDataset(datasetCityScapes);
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  // 76569
  xit('Upload FP32 Mobilenet SSD Lite V2, use VOC dataset, infer (CPU), int8 calibrate (batch 1), infer (CPU)', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.ssdliteMobileNetV2;
    const inferenceTarget = InferenceType.CPU;
    await calibrationUtils.runInt8PipelineThroughUpload(modelFile, datasetFileVOC, inferenceTarget);
  });

  // 76569
  xit(
    'Upload FP32 Mobilenet SSD Lite V2, use Not Annotated dataset, ' +
      'infer (CPU), int8 calibrate - Simplified Mode, infer (CPU)',
    async () => {
      const modelFile = browser.params.precommit_scope.resources.ODModels.ssdliteMobileNetV2;
      const inferenceTarget = InferenceType.CPU;
      await calibrationUtils.runInt8PipelineThroughUpload(modelFile, notAnnotatedDataset, inferenceTarget);
    }
  );

  it(
    'Should upload original Caffe model, convert to IR V10, run inference, run Int-8 Tune with Not Annotated dataset, ' +
      'Simplified Mode',
    async () => {
      const modelFile = browser.params.precommit_scope.resources.classificationModels.googlenetV2;
      const inferenceTarget = InferenceType.CPU;
      await calibrationUtils.runInt8PipelineThroughUpload(modelFile, notAnnotatedDataset, inferenceTarget);
    }
  );

  it(
    'Select squeezenet1.1 from table + Not Annotated dataset, infer (CPU), int8 Simplified Mode, ' +
      'check wait message ',
    async () => {
      const modelFile = { name: 'squeezenet1.1' };
      const inferenceTarget = InferenceType.CPU;
      const inferenceResult = await calibrationUtils.runInt8PipelineThroughDownloader(
        modelFile,
        notAnnotatedDataset,
        inferenceTarget,
        'FP16',
        OptimizationAlgorithm.DEFAULT
      );
      if (inferenceResult === undefined) {
        await browser.sleep(1000);
        await browser.refresh();
        await browser.waitForAngular();
        await expect(await testUtils.inferenceCard.taskIsRunningMessage().isPresent()).toBeFalsy();
      }
    }
  );

  it('Should upload original ONNX model, convert to IR V10, run inference, run Int-8 Tune, accuracy type', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.inceptionV2;
    const inferenceTarget = InferenceType.CPU;
    await calibrationUtils.runInt8PipelineThroughUpload(
      modelFile,
      datasetFileImageNet,
      inferenceTarget,
      OptimizationAlgorithm.ACCURACY_AWARE,
      OptimizationAlgorithmPreset.PERFORMANCE
    );
  });

  it(
    'Should upload original Caffe model, convert to IR V10 FP16, run inference,' +
      ' run Int-8 Tune, accuracy type + Mixed preset',
    async () => {
      const modelFile = browser.params.precommit_scope.resources.classificationModels.squeezenetV1;
      const inferenceTarget = InferenceType.CPU;
      await calibrationUtils.runInt8PipelineThroughUpload(
        modelFile,
        datasetFileImageNet,
        inferenceTarget,
        OptimizationAlgorithm.ACCURACY_AWARE,
        OptimizationAlgorithmPreset.MIXED
      );
    }
  );

  it(
    'Should upload original Caffe model, convert to IR V10, run inference,' +
      ' run Int-8 Tune, performance type + Mixed preset',
    async () => {
      const modelFile = browser.params.precommit_scope.resources.classificationModels.googlenetV2;
      const inferenceTarget = InferenceType.CPU;
      await calibrationUtils.runInt8PipelineThroughUpload(
        modelFile,
        datasetFileImageNet,
        inferenceTarget,
        OptimizationAlgorithm.DEFAULT,
        OptimizationAlgorithmPreset.MIXED
      );
    }
  );

  // 70558
  xit('Should upload original TF model, convert to IR V10, run inference, run Int-8 Tune, performance type', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.inceptionV3TF;
    const inferenceTarget = InferenceType.CPU;
    await calibrationUtils.runInt8PipelineThroughUpload(
      modelFile,
      datasetFileImageNet,
      inferenceTarget,
      OptimizationAlgorithm.DEFAULT,
      OptimizationAlgorithmPreset.MIXED
    );
  });

  it('Should upload OMZ YOLOv2 model, run Int-8 Tune and check accuracy', async () => {
    const modelFile = { name: 'yolo-v2-tiny-tf', framework: Frameworks.TENSORFLOW };
    const resultInt8 = await calibrationUtils.runInt8PipelineThroughDownloader(
      modelFile,
      datasetFileVOC,
      InferenceType.CPU,
      'FP16',
      OptimizationAlgorithm.DEFAULT,
      undefined,
      OptimizationAlgorithmPreset.MIXED
    );
    if (resultInt8 === undefined) {
      const accuracy = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile, true);
      console.log(`Accuracy check end: ${{ accuracy }}`);
    }
  });

  xit('Should upload TensorFlow V2 model, convert to IR V10, run inference, run Int-8 Tune, performance type', async () => {
    // 35744
    const modelFile = browser.params.precommit_scope.resources.classificationModels.MobileNetV2TFV2;
    const inferenceTarget = InferenceType.CPU;
    await calibrationUtils.runInt8PipelineThroughUpload(
      modelFile,
      datasetFileImageNet,
      inferenceTarget,
      OptimizationAlgorithm.DEFAULT,
      OptimizationAlgorithmPreset.MIXED
    );
  });

  // TODO 62219
  xit('Should select OD model from table convert to IR V10, Wider dataset, run inference, run Int-8 Tune, performance type', async () => {
    const modelFile = { name: 'mobilefacedet-v1-mxnet' };
    const inferenceTarget = InferenceType.CPU;
    const inferenceResult = await calibrationUtils.runInt8PipelineThroughDownloader(
      modelFile,
      datasetWiderFace,
      inferenceTarget,
      'FP16',
      OptimizationAlgorithm.DEFAULT
    );
    if (inferenceResult === undefined) {
      await browser.sleep(1000);
      await browser.refresh();
      await browser.waitForAngular();
      await expect(await testUtils.inferenceCard.taskIsRunningMessage().isPresent()).toBeFalsy();
    }
  });

  // TODO: 71307
  // TODO: // 73948
  // xit('Should upload OMZ deeplabv3 model, run Int-8 Tune and check accuracy', async () => {
  //   const modelFile = { name: 'deeplabv3' };
  //   const resultInt8 = await calibrationUtils.runInt8PipelineThroughDownloader(
  //     modelFile,
  //     datasetCityScapes,
  //     InferenceType.CPU,
  //     'FP16',
  //     OptimizationAlgorithm.DEFAULT,
  //     undefined,
  //     OptimizationAlgorithmPreset.MIXED
  //   );
  //   if (resultInt8 === undefined) {
  //     const accuracy = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(modelFile, true);
  //     console.log(`Accuracy check end: ${{ accuracy }}`);
  //   }
  // });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
    await testUtils.deleteUploadedModels();
    await testUtils.uploadedModels.pop();
  });

  afterAll(async () => {
    await testUtils.deleteUploadedDatasets();
    await TestUtils.getBrowserLogs();
  });
});
