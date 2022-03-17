import { isNil } from 'lodash';

import { DownloadItemSocketDTO } from '@store/globals-store/download-log.model';

import { DeviceTargetType, OSTypeNames } from '@shared/models/device';
import { IJob, IPipeline, JobType, PipelineStage, PipelineStageErrorKeys } from '@shared/models/pipelines/pipeline';

import { ModelAnalysis, ModelPrecisionType, THROUGHPUT_UNIT } from '../model-store/model.model';

export interface ProjectExecInfo {
  throughput: number;
  throughputUnit: THROUGHPUT_UNIT;
  latency: number;
  accuracy: number;
}

export enum OptimizationJobTypes {
  PROFILING = 'ProfilingJob',
  INT_8 = 'Int8CalibrationJob',
  // Deprecated, used for backward compatibility
  WINOGRAD = 'WinogradTuneJob',
}

export enum JobTypes {
  WAIT_MODEL_UPLOAD_JOB = 'WaitModelUploadJob',
  MODEL_OPTIMIZER_SCAN = 'ModelOptimizerScanJob',
  SETUP_ENVIRONMENT_JOB = 'SetupEnvironmentJob',
  OMZ_MODEL_CONVERT_JOB = 'OMZModelConvertJob',
  MODEL_OPTIMIZER_JOB = 'ModelOptimizerJob',
  IMPORT_HUGGINGFACE_MODEL_JOB = 'ImportHuggingfaceModelJob',
  OMZ_MODEL_MOVE_JOB = 'OMZModelMoveJob',
  ANALYZE_MODEL_INPUT_SHAPE_JOB = 'AnalyzeModelInputShapeJob',
  MODEL_ANALYZER_JOB = 'ModelAnalyzerJob',

  PREPARING_RESHAPE_MODEL_ASSETS = 'preparing_reshape_model_assets',
  RESHAPE_MODEL = 'reshape_model',
  RESHAPE_MODEL_ANALYZE = 'model_analyzer',
  APPLY_MODEL_LAYOUT = 'apply_model_layout',
}

export const optimizationJobNamesMap = {
  [OptimizationJobTypes.PROFILING]: '',
  [OptimizationJobTypes.INT_8]: 'INT8',
  // Deprecated, used for backward compatibility
  [OptimizationJobTypes.WINOGRAD]: 'Winograd',
};

export enum OptimizationAlgorithm {
  DEFAULT = 'DefaultQuantization',
  ACCURACY_AWARE = 'AccuracyAwareQuantization',
}

export const optimizationAlgorithmNamesMap = {
  [OptimizationAlgorithm.DEFAULT]: 'Default',
  [OptimizationAlgorithm.ACCURACY_AWARE]: 'AccuracyAware',
};

export enum OptimizationAlgorithmPreset {
  PERFORMANCE = 'performance',
  ACCURACY = 'accuracy',
  MIXED = 'mixed',
}

export const OptimizationAlgorithmPresetNames = {
  [OptimizationAlgorithmPreset.PERFORMANCE]: 'Performance Preset',
  [OptimizationAlgorithmPreset.MIXED]: 'Mixed Preset',
};

export interface ProjectConfigParameters {
  optimizationType: OptimizationJobTypes;
  calibrationDatasetName?: string;
  algorithm?: OptimizationAlgorithm;
  preset?: OptimizationAlgorithmPreset;
  subsetSize?: number;
  threshold?: number;

  [key: string]: string | number;
}

export enum ProjectStatusNames {
  RUNNING = 'running',
  ERROR = 'error',
  READY = 'ready',
  QUEUED = 'queued',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived',
}

// TODO Consider renaming to Status w/o project relation
export class ProjectStatus {
  static priority = {
    [ProjectStatusNames.QUEUED]: 1,
    [ProjectStatusNames.READY]: 2,
    [ProjectStatusNames.ERROR]: 3,
    [ProjectStatusNames.RUNNING]: 4,
    [ProjectStatusNames.CANCELLED]: 5,
    [ProjectStatusNames.ARCHIVED]: 6,
  };

  static stagesMap = {
    CreateInt8CalibrationBundleJob: 'Preparing Assets',
    UploadArtifactToTargetJob: 'Uploading Assets',
    ProfilingJob: 'Inference',
    Int8CalibrationJob: 'Int 8 Calibration',
    AccuracyJob: 'Accuracy',
    ExportProjectJob: 'Exporting',
  };

  name:
    | ProjectStatusNames.RUNNING
    | ProjectStatusNames.ERROR
    | ProjectStatusNames.READY
    | ProjectStatusNames.QUEUED
    | ProjectStatusNames.CANCELLED
    | ProjectStatusNames.ARCHIVED;
  progress?: number;
  errorMessage?: string;
  stage?: string | PipelineStage;

  static createStatusByProgress(progress: number): ProjectStatus {
    if (isNil(progress)) {
      return {
        name: ProjectStatusNames.QUEUED,
      };
    }
    if (progress >= 100) {
      return {
        name: ProjectStatusNames.READY,
        progress: 100,
      };
    }
    return {
      name: ProjectStatusNames.RUNNING,
      progress,
    };
  }

  static getStatusStageErrorKey(status: ProjectStatus): string {
    const { stage } = status;
    if (!stage) {
      return 'projectStatusFailed';
    }
    return PipelineStageErrorKeys[stage];
  }
}

interface ProjectOptimizationImprovements {
  modelSize: number;
  performance: number;
}

export interface ProjectItemDTO {
  id: number;
  modelId: number;
  modelName: string;
  datasetId: number;
  datasetName: string;
  targetId: number;
  targetName: string;
  deviceId: number;
  deviceType: DeviceTargetType;
  deviceName: string;
  parentId: number | null;
  originalModelId: number;
  creationTimestamp: string;
  status: ProjectStatus;
  runtimePrecisions: ModelPrecisionType[];
  optimizationImprovements: ProjectOptimizationImprovements;
  execInfo?: ProjectExecInfo;
  configParameters?: ProjectConfigParameters;
  analysisData: ModelAnalysis;
  isAccuracyAvailable: boolean;
  isModelDownloadingAvailable: boolean;
  hasRawAccuracyConfig: boolean;
  jupyterNotebookPath: string | null;
}

interface TableTreeHelperParameters {
  pathFromRoot: number[];
  children: number[];
  isExpanded: boolean;
  isVisible: boolean;
}

export class ProjectItem implements ProjectItemDTO, TableTreeHelperParameters {
  id: number;
  modelId: number;
  originalModelId: number;
  modelName: string;
  datasetId: number;
  datasetName: string;
  targetId: number;
  targetName: string;
  deviceId: number;
  deviceType: DeviceTargetType;
  deviceName: string;
  parentId: number | null;
  creationTimestamp: string;
  status: ProjectStatus;
  runtimePrecisions: ModelPrecisionType[];

  optimizationImprovements: ProjectOptimizationImprovements;
  execInfo?: ProjectExecInfo;
  configParameters?: ProjectConfigParameters;
  analysisData: ModelAnalysis;

  pathFromRoot: number[];
  children: number[];
  isExpanded: boolean;
  isVisible: boolean;
  isAccuracyAvailable: boolean;
  isModelDownloadingAvailable: boolean;
  hasRawAccuracyConfig: boolean;
  jupyterNotebookPath: string | null;

  constructor(
    projectItemDTO: ProjectItemDTO,
    pathFromRoot: number[] = [],
    originalModelId: number | null = null,
    modelNameWithOptimization: string | null = null
  ) {
    this.id = projectItemDTO.id;
    this.modelId = projectItemDTO.modelId;
    this.originalModelId = originalModelId;
    this.modelName = modelNameWithOptimization || projectItemDTO.modelName;
    this.datasetId = projectItemDTO.datasetId;
    this.datasetName = projectItemDTO.datasetName;
    this.targetId = projectItemDTO.targetId;
    this.targetName = projectItemDTO.targetName;
    this.deviceId = projectItemDTO.deviceId;
    this.deviceType = projectItemDTO.deviceType;
    this.deviceName = projectItemDTO.deviceName;
    this.parentId = projectItemDTO.parentId;
    this.optimizationImprovements = projectItemDTO.optimizationImprovements;
    this.execInfo = projectItemDTO.execInfo;
    this.configParameters = projectItemDTO.configParameters;
    this.analysisData = projectItemDTO.analysisData;
    this.creationTimestamp = projectItemDTO.creationTimestamp;
    this.status = projectItemDTO.status;
    this.runtimePrecisions = projectItemDTO.runtimePrecisions;
    this.pathFromRoot = pathFromRoot;
    this.isAccuracyAvailable = projectItemDTO.isAccuracyAvailable;
    this.isModelDownloadingAvailable = projectItemDTO.isModelDownloadingAvailable;
    this.children = [];
    this.isExpanded = true;
    this.isVisible = true;
    this.hasRawAccuracyConfig = projectItemDTO.hasRawAccuracyConfig;
    this.jupyterNotebookPath = projectItemDTO.jupyterNotebookPath;
  }

  static getDeviceName(hardwareName: string): string {
    return hardwareName || 'N/A';
  }

  static getModelNameWithOptimization({ pathFromRoot, modelName, configParameters }: ProjectItem): string {
    return pathFromRoot.length === 0
      ? modelName
      : [modelName, optimizationJobNamesMap[configParameters.optimizationType]].join(' - ');
  }

  static getFullProjectName({ modelName, datasetName, targetName, deviceName }: ProjectItem): string {
    return [modelName, datasetName, targetName, ProjectItem.getDeviceName(deviceName)].join(' • ');
  }
}

export interface RunDeploymentSocketDTO extends IJob {
  artifactId: number;
  projectId: number;
  session_id: string;
  status: ProjectStatus;
  targets: DeviceTargetType[];
  type: JobType.deployment;
  modelName?: string;
  packagePath: string;
  operatingSystem: string;
  tabId: string;
}

export interface DeploymentPipelineSocketDTO extends IPipeline {
  id: number;
  targetId: number;
  jobs: [RunDeploymentSocketDTO];
}

export interface ExportProjectSocketDTO extends IJob {
  artifactId: number;
  type: JobType.export_project_job;
  projectId: number;
  tabId: string;
  projectName: string;
}

export interface ExportProjectPipelineSocketDTO extends IPipeline {
  id: number;
  targetId: number;
  projectId;
  jobs: [ExportProjectSocketDTO];
}

export interface StartExportProjectResponseDTO {
  jobId: number | null;
  artifactId: number;
  message?: string;
  status?: ProjectStatus;
  projectName: string;
}

export interface DeploymentConfig {
  projectId: number;
  includeModel: boolean;
  pythonBindings: boolean;
  installScripts: boolean;
  targetOS: OSTypeNames;
  targets: string[];
}

export interface ExportProjectConfig {
  includeModel: boolean;
  includeDataset: boolean;
  includeAccuracyConfig: boolean;
  includeCalibrationConfig: boolean;
}

export interface ProjectReportSocketDTO extends DownloadItemSocketDTO {
  projectId: number;
}

export interface InferenceReportSocketDTO extends DownloadItemSocketDTO {
  inferenceId: number;
}
