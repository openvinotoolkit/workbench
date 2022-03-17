import { ProjectStatus, ProjectStatusNames } from '@store/project-store/project.model';

import { TargetMachineStatusNames } from '@shared/models/pipelines/target-machines/target-machine';

export enum PipelineType {
  LOCAL_ACCURACY = 'local_accuracy',
  REMOTE_ACCURACY = 'remote_accuracy',
  DEV_CLOUD_ACCURACY = 'dev_cloud_accuracy',
  LOCAL_ACCURACY_PARENT_MODEL_TENSOR_DISTANCE = 'local_per_tensor_report',
  REMOTE_ACCURACY_PARENT_MODEL_TENSOR_DISTANCE = 'remote_per_tensor_report',
  DEV_CLOUD_ACCURACY_PARENT_MODEL_TENSOR_DISTANCE = 'dev_cloud_per_tensor_report',
  LOCAL_ACCURACY_PARENT_MODEL_PREDICTIONS = 'local_predictions_relative_accuracy_report',
  REMOTE_ACCURACY_PARENT_MODEL_PREDICTIONS = 'remote_predictions_relative_accuracy_report',
  DEV_CLOUD_ACCURACY_PARENT_MODEL_PREDICTIONS = 'dev_cloud_predictions_relative_accuracy_report',
  LOCAL_PROFILING = 'local_profiling',
  REMOTE_PROFILING = 'remote_profiling',
  DEV_CLOUD_PROFILING = 'dev_cloud_profiling',
  LOCAL_INT8_CALIBRATION = 'local_int8_calibration',
  REMOTE_INT8_CALIBRATION = 'remote_int8_calibration',
  DEV_CLOUD_INT8_CALIBRATION = 'dev_cloud_int8_calibration',
  INFERENCE_TEST_IMAGE = 'inference_test_image',
  CONFIGURE_MODEL = 'configure_model',
}

export const LOCAL_PIPELINE_TYPES_WITH_PROFILING = [PipelineType.LOCAL_PROFILING, PipelineType.LOCAL_INT8_CALIBRATION];

export enum PipelineStage {
  ACCURACY = 'accuracy',
  PREPARING_SETUP_ASSETS = 'preparing_setup_assets',
  PREPARING_PROFILING_ASSETS = 'preparing_profiling_assets',
  PREPARING_ACCURACY_ASSETS = 'preparing_accuracy_assets',
  UPLOADING_SETUP_ASSETS = 'uploading_setup_assets',
  PREPARING_INT8_CALIBRATION_ASSETS = 'preparing_int8_calibration_assets',
  INT8_CALIBRATION = 'int8_calibration',
  MODEL_ANALYZER = 'model_analyzer',
  PROFILING = 'profiling',
  GETTING_REMOTE_JOB_RESULT = 'getting_remote_job_result',
  INFERENCE_TEST_IMAGE = 'inference_test_image',
  EXPORT_PROJECT = 'export_project',
}

export const CalibrationPipelineStages = [
  PipelineStage.PREPARING_INT8_CALIBRATION_ASSETS,
  PipelineStage.INT8_CALIBRATION,
  PipelineStage.MODEL_ANALYZER,
];

export const AccuracyPipelineStages = [PipelineStage.PREPARING_ACCURACY_ASSETS, PipelineStage.ACCURACY];
export const ProfilingPipelineStages = [PipelineStage.PREPARING_PROFILING_ASSETS, PipelineStage.PROFILING];

export const PipelineStageErrorKeys = {
  [PipelineStage.ACCURACY]: 'accuracyFailed',
  [PipelineStage.PREPARING_ACCURACY_ASSETS]: 'accuracyFailed',
  [PipelineStage.PREPARING_INT8_CALIBRATION_ASSETS]: 'int8CalibrationFailed',
  [PipelineStage.INT8_CALIBRATION]: 'int8CalibrationFailed',
  [PipelineStage.MODEL_ANALYZER]: 'int8CalibrationFailed',
  [PipelineStage.PREPARING_PROFILING_ASSETS]: 'profilingFailed',
  [PipelineStage.PROFILING]: 'profilingFailed',
  [PipelineStage.EXPORT_PROJECT]: 'projectExportFailed',
};

export class PipelineStatus {
  // Will be extended as more jobs are transitioned to pipelines
  static readonly displayStagesMap = {
    [PipelineStage.PREPARING_ACCURACY_ASSETS]: 'Preparing',
    [PipelineStage.UPLOADING_SETUP_ASSETS]: 'Uploading',
    [PipelineStage.ACCURACY]: 'Accuracy',
    [PipelineStage.EXPORT_PROJECT]: 'Export',
    [PipelineStage.PREPARING_SETUP_ASSETS]: 'Packaging',
  };

  progress: number;
  name: ProjectStatusNames;
  stage: PipelineStage;
  errorMessage?: string;
}

export interface IPipeline {
  id: number;
  type: PipelineType;
  status: PipelineStatus;
  targetId: number;
  projectId: number;
  targetStatus: TargetMachineStatusNames;
  jobs: IJob[];
}

export enum JobType {
  deployment = 'CreateSetupBundleJob',
  export_project_job = 'ExportProjectJob',
  accuracy_job = 'AccuracyJob',
  profiling_job = 'ProfilingJob',
  inference_test_image = 'InferenceTestImageJob',
  per_tensor_report = 'PerTensorReportJob',
  reshape_job = 'ReshapeModelJob',
  apply_model_layout_job = 'ApplyModelLayoutJob',
}

export interface IJob {
  jobId: number;
  type: JobType;
  status: ProjectStatus;
}
