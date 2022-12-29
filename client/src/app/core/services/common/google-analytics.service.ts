import { Injectable } from '@angular/core';

import { isNumber, uniqBy } from 'lodash';
import { Angulartics2GoogleGlobalSiteTag } from 'angulartics2/gst';

import { environment } from '@env';

import {
  ModelDomain,
  modelDomainNames,
  modelFrameworkNamesMap,
  ModelItem,
  ModelSources,
  ModelTaskMethods,
  ModelTaskTypeNames,
  ModelTaskTypes,
  TaskMethodToNameMap,
  TaskTypeToNameMap,
} from '@store/model-store/model.model';
import {
  DatasetAugmentationDTO,
  DatasetItem,
  DatasetTypeToNameMap,
  UploadingTextDatasetDTO,
} from '@store/dataset-store/dataset.model';
import { IInferenceResult } from '@store/inference-history-store/inference-history.model';
import {
  DeploymentConfig,
  ExportProjectConfig,
  optimizationAlgorithmNamesMap,
  OptimizationAlgorithmPresetNames,
  optimizationJobNamesMap,
  OptimizationJobTypes,
  ProjectItem,
} from '@store/project-store/project.model';
import {
  ILayerTimePrecisionDistribution,
  IPrecisionTransitions,
} from '@store/inference-result-store/inference-result.model';
import { ITestImage } from '@store/inference-test-image-store/inference-test-image-models';

import { CompoundInferenceConfig } from '@shared/models/compound-inference-config';
import { TargetMachineItem, TargetMachineTypesNamesMap } from '@shared/models/pipelines/target-machines/target-machine';
import { UploadModelSocketDTO } from '@shared/models/dto/upload-socket-message-dto';
import { DeviceItem } from '@shared/models/device';
import { AccuracyReportType } from '@shared/models/accuracy-analysis/accuracy-report';
import { ITokenizer, TOKENIZER_TYPE_NAME } from '@shared/models/tokenizer/tokenizer';
import { IHuggingfaceModel } from '@shared/models/huggingface/huggingface-model';

import { PrecisionAnalysisService } from '../../../modules/dashboard/components/precision-analysis/precision-analysis.service';
import { ExecutedLayerItem } from '../../../modules/dashboard/components/model-layers-with-graphs/layers-table/layers-table.model';
import { SampleTutorialType } from '../../../modules/dashboard/components/open-sample-tutorial/open-sample-tutorial.component';
import { VisualizationType } from '../../../modules/accuracy/components/visualization/network-output/original-image-controls/original-image-controls.component';

export const enum Categories {
  GENERAL = 'General',
  MODEL = 'Model',
  DATASET = 'Dataset',
  INFERENCE = 'Inference',
  PACKAGE = 'Package',
  OPTIMIZATION = 'Optimization',
  ANALYTICS = 'Analytics',
  ACCURACY = 'Accuracy',
  ERROR = 'Error',
  INFERENCE_CHART = 'Inference Results Chart',
  INFERENCE_TABLE = 'Inference History Table',
  PER_LAYER_TABLE = 'Per-layer Table',
  TEST_INFER = 'Test Inference',
  NETRON = 'Netron',
  EXPORT_REPORT = 'Export Report',
  REMOTE_MACHINE = 'Remote Machine',
  COMPARISON = 'Comparison',
  EXPORT_PROJECT = 'Export project',
  RUNTIME_PRECISIONS = 'Runtime precisions',
  JUPYTER = 'Jupyter',
  FEEDBACK = 'Feedback',
  LAUNCHER = 'Launcher',
  TOKENIZER = 'Tokenizer',
}

export const enum GAActions {
  RUN = 'Run',
  TRIGGER = 'Trigger',
  REPORT_RESULTS = 'Report results',
  APPLY = 'Apply',
  REFUSE = 'Refuse',
  DEVICES = 'Devices',
  CANCEL = 'Cancel',
  OMZ_DOWNLOAD = 'OMZ Download',
  HUGGINGFACE_IMPORT_START = 'Huggingface import start',
  HUGGINGFACE_IMPORT = 'Huggingface import',
  HUGGINGFACE_LIST = 'Huggingface list',
  HUGGINGFACE_MODEL_DETAILS = 'Huggingface model details',
  LOCAL_UPLOAD = 'Local Upload',
  COMPARE = 'Compare',
  CREATE = 'Create',
  LOCAL_DATASET_UPLOAD = 'Local-Dataset-Upload',
  LOCAL_TEXT_UPLOAD = 'Local-Text-Upload',
  LOCAL_MODEL_UPLOAD = 'Local-Model-Upload',
  EXPORT = 'Export',
  EXPORT_PROJECT = 'Export project',
  TEST_INFERENCE = 'Test Inference',
  DOWNLOAD = 'Download',
  PACKAGE = 'Package',
  INT8 = 'INT8',
  VISUALIZE = 'Visualize',
  ACCURACY = 'Accuracy',
  SETUP = 'Setup',
  CONVERT = 'Convert',
  REMOTE = 'Remote Target',
  SWEETSPOT = 'SweetSpot selected',
  SELECT_INFERENCE = 'Select Inference Result',
  FILTER = 'Filter',
  SELECT_LAYER = 'Select Layer',
  GENERATE = 'Generate',
  TIME_COLORING = 'Time Coloring',
  USAGE_CHANGE = 'Usage Change',
  ANALYSIS = 'Analysis',
  OPEN_SAMPLE = 'Open jupyter sample',
  OPEN_GENERATED = 'Open generated notebook',
  OPEN_JUPYTER_LAB = 'Open JupyterLab',
  OPEN_OPENVINO_NOTEBOOK = 'Open OpenVINO notebook',
  EARLY_TEST_INFER = 'Early Test Infer',
  EARLY_VISUALIZE = 'Early Visualize',
  CONTACT_DL_WB = 'Contact DL WB Team',
  DOCKER = 'Docker',
  PYTHON_WRAPPER = 'Python Wrapper',
}

const enum DimensionsEnum {
  DEVCLOUD = 'dimension1',
  VERSION = 'dimension2',
}

interface AccuracyEventMetadata {
  originalModel: ModelItem;
  dataset: DatasetItem;
  project: ProjectItem;
  parentProject: ProjectItem;
}

const GA_DISABLE_COOKIE = 'ga-disable-' + environment?.googleAnalyticsID;

@Injectable({
  providedIn: 'root',
})
export class GoogleAnalyticsService {
  constructor(
    private angulariticsGTS: Angulartics2GoogleGlobalSiteTag,
    private precisionAnalysisService: PrecisionAnalysisService
  ) {}

  private hasReportedDevices = false;
  private hasReportedLaunchOption = false;

  static getJobExecTime(createdTs: number): number {
    return Math.abs((Date.now() - createdTs) / 1000);
  }

  public emitRunInferEvent(
    config: CompoundInferenceConfig,
    model: ModelItem,
    dataset: DatasetItem,
    machine: TargetMachineItem
  ): void {
    const streams = uniqBy(config.inferences, 'nireq').length;
    const batches = uniqBy(config.inferences, 'batch').length;
    const isOMZ = model.modelSource === ModelSources.OMZ;
    const autogenerated = model.domain === ModelDomain.NLP && !isNumber(model.selectedTokenizerId);
    this.emitEvent(GAActions.RUN, Categories.INFERENCE, {
      mode: streams === 1 && batches === 1 ? 'Single' : 'Group',
      deviceName: config.deviceName,
      modelType: TaskMethodToNameMap[model.accuracyConfiguration.taskMethod],
      modelDomain: modelDomainNames[model.domain],
      datasetType: DatasetTypeToNameMap[dataset.type],
      originalDatasetType: DatasetTypeToNameMap[dataset.originalType],
      modelName: isOMZ ? model.name : 'other',
      isOMZ,
      modelSource: model.modelSource,
      target: TargetMachineTypesNamesMap[machine.targetType],
      autogenerated,
      OS: machine.operatingSystem,
    });
  }

  public emitInferenceReportEvent(inferResult: IInferenceResult, baselineResult: IInferenceResult): void {
    const { batch, nireq, throughput, latency, isAutoBenchmark } = inferResult;
    const label = {
      batch,
      streams: nireq,
      throughput,
      latency,
      isAutoBenchmark,
      throughput_vs_baseline_ratio: null,
      latency_vs_baseline_ratio: null,
    };

    if (baselineResult?.throughput && baselineResult?.latency) {
      label.throughput_vs_baseline_ratio = Number((throughput / baselineResult.throughput).toFixed(2));
      label.latency_vs_baseline_ratio = Number((latency / baselineResult.latency).toFixed(2));
    }

    this.emitEvent(GAActions.REPORT_RESULTS, Categories.INFERENCE, label);
  }

  public emitEvent(action: string, category: string, label?): void {
    this.angulariticsGTS.eventTrack(action, {
      category,
      label: JSON.stringify(label),
    });
  }

  public emitDeployEvent(config: DeploymentConfig): void {
    const devices = config.targets.reduce((acc, target) => acc + target + ' ', '');
    const { includeModel, installScripts, pythonBindings, targetOS } = config;
    this.emitEvent(GAActions.RUN, Categories.PACKAGE, {
      devices,
      includeModel,
      installScripts,
      pythonBindings,
      targetOS,
    });
  }

  public emitPrecisionAnalysis(
    layerPrecisionDistribution: ILayerTimePrecisionDistribution[],
    layers: ExecutedLayerItem[],
    precisionTransitions: IPrecisionTransitions,
    project: ProjectItem
  ): void {
    const reorderRatio = this.precisionAnalysisService.calculateReordersShare(layerPrecisionDistribution);
    const nonI8ConvolutionRatio = this.precisionAnalysisService.calculateFPConvShare(layers);
    const int8Ratio = this.precisionAnalysisService.calculateInt8Share(layers);
    const fp16Ratio = this.precisionAnalysisService.calculateFP16Share(layers);
    const { deviceName, configParameters } = project;
    const { algorithm, preset, threshold } = configParameters;
    this.emitEvent(GAActions.ANALYSIS, Categories.RUNTIME_PRECISIONS, {
      reorderRatio,
      nonI8ConvolutionRatio,
      int8Ratio,
      fp16Ratio,
      deviceName,
      algorithm,
      preset,
      threshold,
      precisionTransitions,
    });
  }

  public emitModelUsageChangeEvent(
    modelTask: ModelTaskTypes,
    modelMethod: ModelTaskMethods,
    modelDomain: ModelDomain
  ): void {
    this.emitEvent(GAActions.USAGE_CHANGE, Categories.MODEL, {
      modelTask: TaskTypeToNameMap[modelTask],
      modelMethod: TaskMethodToNameMap[modelMethod],
      modelDomain,
    });
  }

  public emitExportProjectEvent(config: ExportProjectConfig): void {
    const { includeModel, includeDataset, includeAccuracyConfig, includeCalibrationConfig } = config;
    this.emitEvent(GAActions.EXPORT, Categories.EXPORT_PROJECT, {
      includeModel,
      includeDataset,
      includeAccuracyConfig,
      includeCalibrationConfig,
    });
  }

  public setAnalyticsCollectionState(agree: boolean): void {
    window[GA_DISABLE_COOKIE] = !agree;
    if (agree) {
      this.angulariticsGTS.startTracking();
    }
  }

  public emitAnalyticsApplyEvent(): void {
    this.setAnalyticsCollectionState(true);
    this.emitEvent(GAActions.APPLY, Categories.ANALYTICS);
  }

  public emitAnalyticsRefuseEvent(): void {
    this.emitEvent(GAActions.REFUSE, Categories.ANALYTICS);
    this.setAnalyticsCollectionState(false);
  }

  public emitAvailableDevicesEvent(devices: DeviceItem[]): void {
    if (this.hasReportedDevices || !devices) {
      return;
    }
    this.hasReportedDevices = true;
    const availableDevices = devices.reduce((acc, curDevice) => acc + curDevice.productName + ' ', '');
    this.emitEvent(GAActions.DEVICES, Categories.GENERAL, { availableDevices });
  }

  public emitCancelEvent(category: string): void {
    this.angulariticsGTS.eventTrack(GAActions.CANCEL, {
      category,
    });
  }

  public emitErrorEvent(action: string, err: string): void {
    this.emitEvent(action, Categories.ERROR, { err });
  }

  public emitUploadModelEvent(modelDescription: UploadModelSocketDTO, model: ModelItem): void {
    const modelDomain = modelDomainNames[model.domain];
    if (model.modelSource === ModelSources.OMZ) {
      this.emitEvent(GAActions.OMZ_DOWNLOAD, Categories.MODEL, {
        name: modelDescription.name,
        precisions: modelDescription.bodyPrecisions.join(' '),
        framework: modelFrameworkNamesMap[model.framework],
        modelType: TaskMethodToNameMap[model.accuracyConfiguration.taskMethod],
        modelDomain,
        downloadTime: GoogleAnalyticsService.getJobExecTime(modelDescription.date),
      });
      return;
    }

    if (model.modelSource === ModelSources.HUGGINGFACE) {
      this.emitEvent(GAActions.HUGGINGFACE_IMPORT, Categories.MODEL, {
        name: modelDescription.name,
        modelDomain,
        modelSource: model.modelSource,
      });
      return;
    }

    this.emitEvent(GAActions.LOCAL_UPLOAD, Categories.MODEL, { modelDomain });
  }

  public emitOptimizationEvent(
    projectItem: ProjectItem,
    targetItem: TargetMachineItem,
    model: ModelItem,
    dataset: DatasetItem
  ): void {
    const { configParameters, deviceName } = projectItem;
    const action = optimizationJobNamesMap[configParameters.optimizationType];
    const target = TargetMachineTypesNamesMap[targetItem.targetType];
    const isOMZ = model.modelSource === ModelSources.OMZ;
    const modelType = TaskMethodToNameMap[model.accuracyConfiguration.taskMethod];
    const jobTime = GoogleAnalyticsService.getJobExecTime(new Date(projectItem.creationTimestamp).getTime());
    const { algorithm, preset, calibrationDatasetName } = configParameters;
    const label = {
      algorithm,
      preset: OptimizationAlgorithmPresetNames[preset],
      separateCalibrationDataset: projectItem.datasetName !== calibrationDatasetName,
      target,
      isOMZ,
      modelType,
      modelDomain: modelDomainNames[model.domain],
      datasetType: DatasetTypeToNameMap[dataset.type],
      originalDatasetType: DatasetTypeToNameMap[dataset.originalType],
      datasetSubset: configParameters.subsetSize,
      datasetSize: dataset.size,
      jobTime,
      deviceName,
    };
    this.emitEvent(action, Categories.OPTIMIZATION, label);
  }

  public emitTriggerAccuracyReportEvent(reportType: AccuracyReportType, metadata: AccuracyEventMetadata): void {
    const labels = this._getAccuracyEventLabels(metadata);
    this.emitEvent(Categories.ACCURACY, GAActions.TRIGGER, { reportType, ...labels });
  }

  public emitAccuracyReportCreatedEvent(reportType: AccuracyReportType, metadata: AccuracyEventMetadata): void {
    const { project, parentProject } = metadata;
    const accuracy = reportType === AccuracyReportType.DATASET_ANNOTATIONS ? project?.execInfo?.accuracy : null;
    const accuracyDrop =
      accuracy && parentProject?.execInfo.accuracy ? parentProject.execInfo.accuracy - accuracy : null;
    const labels = this._getAccuracyEventLabels(metadata);
    this.emitEvent(GAActions.RUN, Categories.ACCURACY, { reportType, accuracy, accuracyDrop, ...labels });
  }

  public emitAccuracyReportErrorEvent(reportType: AccuracyReportType, metadata: AccuracyEventMetadata): void {
    const { project } = metadata;
    const err = project?.status?.errorMessage;
    const labels = this._getAccuracyEventLabels(metadata);
    this.emitEvent(Categories.ERROR, GAActions.ACCURACY, { reportType, err, ...labels });
  }

  public emitAccuracyReportVisualizationEvent(reportType: AccuracyReportType): void {
    this.emitEvent(Categories.ACCURACY, GAActions.VISUALIZE, { reportType });
  }

  private _getAccuracyEventLabels = ({ originalModel, dataset, project }: AccuracyEventMetadata): object => {
    const modelType = TaskMethodToNameMap[originalModel?.accuracyConfiguration.taskMethod];
    const modelDomain = modelDomainNames[originalModel.domain];
    const isOMZ = originalModel?.modelSource === ModelSources.OMZ;
    const datasetType = DatasetTypeToNameMap[dataset?.type];
    const originalDatasetType = DatasetTypeToNameMap[dataset?.originalType];
    const optimizationType = project?.configParameters.optimizationType;
    const optimization = optimizationJobNamesMap[optimizationType];
    const isInt8 = optimizationType === OptimizationJobTypes.INT_8;
    const optimizationMethod = isInt8 ? optimizationAlgorithmNamesMap[project?.configParameters.algorithm] : null;
    const optimizationPreset = isInt8 ? OptimizationAlgorithmPresetNames[project?.configParameters.preset] : null;

    return {
      modelType,
      modelDomain,
      isOMZ,
      isInt8,
      datasetType,
      originalDatasetType,
      optimization,
      optimizationMethod,
      optimizationPreset,
    };
  };

  public emitTestInferenceEvent({ predictions, refPredictions }: ITestImage, model: ModelItem): void {
    const modelType = TaskMethodToNameMap[model.accuracyConfiguration.taskMethod] as ModelTaskTypeNames;
    const isImportanceMapVisualization = predictions.some(({ explanation_mask }) => explanation_mask);
    let visualizationType: VisualizationType;
    if (refPredictions) {
      visualizationType = VisualizationType.PARENT_MODEL_PREDICTIONS;
    } else if (isImportanceMapVisualization) {
      visualizationType = VisualizationType.EXPLAIN;
    } else {
      visualizationType = VisualizationType.DEFAULT;
    }

    this.emitEvent(GAActions.RUN, Categories.TEST_INFER, {
      modelDomain: modelDomainNames[model.domain],
      predictions: predictions.length,
      modelType,
      visualizationType,
      isInt8: model?.analysis?.isInt8,
    });
  }

  public emitNetronVisualizationEvent(model: ModelItem): void {
    const modelType = TaskMethodToNameMap[model.accuracyConfiguration.taskMethod];
    const modelDomain = modelDomainNames[model.domain];
    this.emitEvent(GAActions.VISUALIZE, Categories.NETRON, { modelType, modelDomain });
  }

  public emitComparisonEvent(
    firstTarget: TargetMachineItem,
    secondTarget: TargetMachineItem,
    model: ModelItem,
    projectA: ProjectItem,
    projectB: ProjectItem
  ): void {
    this.emitEvent(GAActions.COMPARE, Categories.COMPARISON, {
      modelType: TaskMethodToNameMap[model.accuracyConfiguration.taskMethod],
      modelDomain: modelDomainNames[model.domain],
      targetA: TargetMachineTypesNamesMap[firstTarget.targetType],
      targetB: TargetMachineTypesNamesMap[secondTarget.targetType],
      isDerivative: projectA.parentId === projectB.id || projectB.parentId === projectA.id,
    });
  }

  public emitDatasetCreate(augmentationConfig: DatasetAugmentationDTO): void {
    this.emitEvent(GAActions.CREATE, Categories.DATASET, {
      horizontalFlip: augmentationConfig.applyHorizontalFlip,
      verticalFlip: augmentationConfig.applyVerticalFlip,
      randomErase: augmentationConfig.applyErase,
      noiseInjection: augmentationConfig.applyNoise,
      colorSpace: augmentationConfig.applyImageCorrections,
    });
  }

  public emitUploadTextDataset({ settings }: UploadingTextDatasetDTO): void {
    this.emitEvent(GAActions.LOCAL_TEXT_UPLOAD, Categories.DATASET, {
      taskType: TaskTypeToNameMap[settings.taskType],
      separator: settings.separator,
      header: settings.header,
      encoding: settings.encoding,
    });
  }

  public emitUploadTokenizer(tokenizer: ITokenizer): void {
    this.emitEvent(GAActions.LOCAL_UPLOAD, Categories.TOKENIZER, {
      type: TOKENIZER_TYPE_NAME[tokenizer.type],
      vocabSize: tokenizer.vocabSize,
    });
  }

  public emitOpenJupyterSampleEvent(taskType: ModelTaskTypes, sampleType: SampleTutorialType): void {
    this.emitEvent(GAActions.OPEN_SAMPLE, Categories.JUPYTER, { taskType, sampleType });
  }

  public emitOpenJupyterGeneratedEvent(): void {
    this.emitEvent(GAActions.OPEN_GENERATED, Categories.JUPYTER);
  }

  public emitOpenJupyterLabEvent(): void {
    this.emitEvent(GAActions.OPEN_JUPYTER_LAB, Categories.JUPYTER);
  }

  public emitOpenOpenVINONotebookEvent(notebookName: string): void {
    this.emitEvent(GAActions.OPEN_OPENVINO_NOTEBOOK, Categories.JUPYTER, { notebookName });
  }

  public emitLaunchOption(launchedViaWrapper: boolean): void {
    if (this.hasReportedLaunchOption) {
      return;
    }
    this.hasReportedLaunchOption = true;
    const action = launchedViaWrapper ? GAActions.PYTHON_WRAPPER : GAActions.DOCKER;
    this.emitEvent(action, Categories.LAUNCHER);
  }

  public setDimensions(isDevcloud: boolean, version: string): void {
    this.angulariticsGTS.setUserProperties({
      [DimensionsEnum.DEVCLOUD]: isDevcloud,
      [DimensionsEnum.VERSION]: version,
    });
  }

  public emitImportHuggingfaceModelStart(model: IHuggingfaceModel): void {
    this.emitEvent(GAActions.HUGGINGFACE_IMPORT_START, Categories.MODEL, {
      huggingfaceModelId: model.id,
      modelType: model.config?.modelType,
      pipelineTag: model.pipelineTag,
    });
  }

  public emitImportHuggingfaceModelFailure(error: string): void {
    this.emitEvent(GAActions.HUGGINGFACE_IMPORT, Categories.ERROR, { error });
  }

  public emitHuggingfaceListLoad(timeToLoad: number): void {
    this.emitEvent(GAActions.HUGGINGFACE_LIST, Categories.MODEL, { timeToLoad });
  }

  public emitHuggingfaceListLoadFailure(error: string): void {
    this.emitEvent(GAActions.HUGGINGFACE_LIST, Categories.ERROR, { error });
  }

  public emitHuggingfaceLoadReadmeSuccess(huggingfaceModelId: string): void {
    this.emitEvent(GAActions.HUGGINGFACE_MODEL_DETAILS, Categories.MODEL, { huggingfaceModelId });
  }

  public emitHuggingfaceLoadReadmeFailure(huggingfaceModelId: string, error: string): void {
    this.emitEvent(GAActions.HUGGINGFACE_MODEL_DETAILS, Categories.ERROR, { huggingfaceModelId, error });
  }
}
