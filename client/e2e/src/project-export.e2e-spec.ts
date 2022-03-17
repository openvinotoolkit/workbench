import { browser } from 'protractor';

import { ModelPrecisionEnum } from '@store/model-store/model.model';
import { OptimizationAlgorithm } from '@store/project-store/project.model';

import { InferenceType, OptimizationType } from './pages/configuration-wizard.po';
import { Frameworks, TestUtils } from './pages/test-utils';
import { InferenceUtils } from './pages/inference-utils';
import { ExportSheet, ProjectExportConfig } from './pages/export-project.po';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';
import { CalibrationUtils } from './pages/calibration-utils';

const fs = require('fs');

describe('UI tests on Project Exporting', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  let calibrationUtils: CalibrationUtils;
  let analyticsPopup: AnalyticsPopup;
  let exportSheet: ExportSheet;
  const exportedArchivePaths = {};
  const datasetFileImageNet = browser.params.precommit_scope.resources.imageNetDataset;
  const datasetFileVOC = browser.params.precommit_scope.resources.smallVOCDataset;

  beforeAll(async () => {
    testUtils = new TestUtils();
    inferenceUtils = new InferenceUtils(testUtils);
    analyticsPopup = new AnalyticsPopup();
    calibrationUtils = new CalibrationUtils(testUtils);
    exportSheet = new ExportSheet();
    await testUtils.homePage.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.uploadDataset(datasetFileImageNet);
    await testUtils.uploadDataset(datasetFileVOC);
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  it('should upload FP16 IR V11 model, run inference, export project (include model and dataset)', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.squeezenetIRV11;
    await inferenceUtils.runInference(
      modelFile,
      datasetFileImageNet,
      InferenceType.CPU,
      browser.params.precommit_scope.resource_dir
    );

    const projectExportConfig = new ProjectExportConfig(modelFile.name, datasetFileImageNet.name, {
      includeModel: true,
      includeDataset: true,
      includeAC: false,
      includeCC: false,
    });

    await exportSheet.exportProject(projectExportConfig);
    exportedArchivePaths['SQUEEZENET'] = projectExportConfig.archivePath;
  });

  // 74090
  xit('should upload FP32 IR V10 model, run inference, run INT8, export INT8 project (include all)', async () => {
    const modelFile = browser.params.precommit_scope.resources.ODModels.ssdliteMobileNetV2;

    // Have to use these functions directly because of name generation
    const levels = [OptimizationType.INT_8];
    await inferenceUtils.runInference(
      modelFile,
      datasetFileVOC,
      InferenceType.CPU,
      browser.params.precommit_scope.resource_dir
    );
    await calibrationUtils.runCalibration(
      modelFile,
      datasetFileVOC.name,
      InferenceType.CPU,
      levels,
      OptimizationAlgorithm.ACCURACY_AWARE,
      100,
      10
    );

    const projectExportConfig = new ProjectExportConfig(modelFile.name + '_INT8', datasetFileVOC.name, {
      includeModel: true,
      includeDataset: true,
      includeAC: true,
      includeCC: true,
    });

    await exportSheet.exportProject(projectExportConfig);
    exportedArchivePaths['MOBILENET'] = projectExportConfig.archivePath;
  });

  it('should download a model from OMZ, run inference, export INT8 project (include all but Calibration Config)', async () => {
    const model = { name: 'resnet-50-tf', framework: Frameworks.CAFFE2 };
    const inferenceTarget = InferenceType.CPU;
    await inferenceUtils.runInferencePipelineThroughDownloader(
      model,
      datasetFileImageNet,
      inferenceTarget,
      null,
      ModelPrecisionEnum.FP16,
      true
    );

    const projectExportConfig = new ProjectExportConfig(model.name, datasetFileImageNet.name, {
      includeModel: true,
      includeDataset: true,
      includeAC: true,
      includeCC: false,
    });

    await exportSheet.exportProject(projectExportConfig);
    exportedArchivePaths['RESNET'] = projectExportConfig.archivePath;
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

    // Write paths to the exported archives
    await fs.writeFile(
      `${browser.params.precommit_scope.downloadedFiles}/paths_to_exported_archives.json`,
      JSON.stringify(exportedArchivePaths),
      'utf8',
      function (err) {
        if (err) {
          throw new Error(err);
        }
        console.log('The exported archive paths file was saved!');
      }
    );
  });
});
