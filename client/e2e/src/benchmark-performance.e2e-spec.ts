import { browser } from 'protractor';

import { IInferenceConfiguration } from '@shared/models/compound-inference-config';

import { TestUtils } from './pages/test-utils';
import { InferenceUtils } from './pages/inference-utils';
import { BenchmarkPerformanceReportDumper } from './utils/benchmark-performance-report/benchmark-performance-report-dumper';
import { IBenchmarkInference } from './utils/benchmark-performance-report/benchmark-performance-report';
import { OpenVINOIRModel } from './pages/model-file';
import { LoginPage } from './pages/login.po';
import { InferenceType } from './pages/configuration-wizard.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';

describe('UI tests for comparing benchmark performance between CLI and UI inferences', () => {
  let testUtils: TestUtils;
  let inferenceUtils: InferenceUtils;
  let analyticsPopup: AnalyticsPopup;

  const datasetFileSmallVOC = browser.params.precommit_scope.resources.smallVOCDataset;

  const performanceTestTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL * 7;

  const MODELS = {
    modelFileYoloV2: browser.params.precommit_scope.resources.ODModels.yoloV2 as OpenVINOIRModel,
    inceptionV3: browser.params.precommit_scope.resources.classificationModels.inceptionV3 as OpenVINOIRModel,
  };

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

    await testUtils.uploadDataset(datasetFileSmallVOC);
  });

  beforeEach(async () => {
    await testUtils.testPreparation();
    await testUtils.homePage.openConfigurationWizard();
    await testUtils.modelManagerPage.goToModelManager();
  });

  // TODO: 78654
  xit(
    'Run local single and group inferences (yolo_v2) several times, save results to json report, compare with CLI',
    async () => {
      const yoloV2Model = {
        ...MODELS.modelFileYoloV2,
        conversionSettings: {
          ...MODELS.modelFileYoloV2.conversionSettings,
          setLayout: true,
        },
      };
      await inferenceUtils.runInference(
        yoloV2Model,
        datasetFileSmallVOC,
        InferenceType.CPU,
        browser.params.precommit_scope.resource_dir
      );
      await _checkLocalInferencePerformance(yoloV2Model);
    },
    performanceTestTimeout
  );

  it(
    'Run local single and group inferences (inceptionV3) several times, save results to json report, compare with CLI',
    async () => {
      const inceptionV3Model = MODELS.inceptionV3;
      await inferenceUtils.runInference(
        inceptionV3Model,
        datasetFileSmallVOC,
        InferenceType.CPU,
        browser.params.precommit_scope.resource_dir
      );
      await _checkLocalInferencePerformance(inceptionV3Model);
    },
    performanceTestTimeout
  );

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

  async function _collectLocalSingleInferencePerformance(
    model: OpenVINOIRModel
  ): Promise<BenchmarkPerformanceReportDumper> {
    const benchmarkPerformanceReportDumper = new BenchmarkPerformanceReportDumper(model);

    let inferences: IBenchmarkInference[] = [];

    for (const [batch, streams] of benchmarkPerformanceReportDumper.configExperiments) {
      inferences = [];
      for (let i = 0; i < benchmarkPerformanceReportDumper.configExperimentsNumber; i++) {
        await inferenceUtils.runSingleInference(batch, streams);
        const allInferenceResults = await testUtils.inferenceCard.collectInfoFromInferenceHistory();
        const inferenceResult: IBenchmarkInference = allInferenceResults.find(
          (tableResult) => tableResult.batch === batch && tableResult.streams === streams
        );
        if (!inferenceResult) {
          throw Error(`No row found in inference history table with batch ${batch}, streams ${streams}`);
        }
        inferences.push(inferenceResult);
      }
      benchmarkPerformanceReportDumper.addLocalSingleExperiment(inferences);
    }
    benchmarkPerformanceReportDumper.saveReport();
    benchmarkPerformanceReportDumper.printThroughputDropReport();
    return benchmarkPerformanceReportDumper;
  }

  async function _collectLocalGroupInferencePerformance(
    model: OpenVINOIRModel
  ): Promise<BenchmarkPerformanceReportDumper> {
    const benchmarkPerformanceReportDumper = new BenchmarkPerformanceReportDumper(model);

    const allInferences: IBenchmarkInference[] = [];

    for (let i = 0; i < benchmarkPerformanceReportDumper.configExperimentsNumber; i++) {
      const inferenceConfig: IInferenceConfiguration[] = benchmarkPerformanceReportDumper.configExperiments.map(
        ([batch, nireq]) => ({
          nireq,
          batch,
        })
      );
      await inferenceUtils.runGroupInferenceFromConfigurationBlock(false, inferenceConfig, false);
      const allInferenceResults = await testUtils.inferenceCard.collectInfoFromInferenceHistory();
      // Filter batch 1 streams 1 inference for group inference as it was performed first and has better performance
      const inferenceResultsForReport: IBenchmarkInference[] = allInferenceResults.filter(
        (tableResult) => tableResult.batch !== 1 || tableResult.streams !== 1
      );
      allInferences.push(...inferenceResultsForReport);
    }
    benchmarkPerformanceReportDumper.addLocalGroupExperiments(allInferences);

    benchmarkPerformanceReportDumper.saveReport();
    benchmarkPerformanceReportDumper.printThroughputDropReport();
    return benchmarkPerformanceReportDumper;
  }

  async function _checkLocalInferencePerformance(model: OpenVINOIRModel): Promise<void> {
    await _collectLocalSingleInferencePerformance(model);
    const benchmarkPerformanceReportDumper = await _collectLocalGroupInferencePerformance(model);
    benchmarkPerformanceReportDumper.checkAcceptablePerformanceDrop();
  }
});
