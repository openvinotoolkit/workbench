import { IJob, IPipeline, JobType, PipelineType } from '@shared/models/pipelines/pipeline';

export interface IAccuracyJob extends IJob {
  type: JobType.accuracy_job;
  projectId: number;
  jobId: number;
}

export interface IAccuracyPipeline extends IPipeline {
  id: number;
  type:
    | PipelineType.LOCAL_ACCURACY
    | PipelineType.REMOTE_ACCURACY
    | PipelineType.DEV_CLOUD_ACCURACY
    | PipelineType.LOCAL_ACCURACY_PARENT_MODEL_PREDICTIONS
    | PipelineType.REMOTE_ACCURACY_PARENT_MODEL_PREDICTIONS
    | PipelineType.DEV_CLOUD_ACCURACY_PARENT_MODEL_PREDICTIONS
    | PipelineType.LOCAL_ACCURACY_PARENT_MODEL_TENSOR_DISTANCE
    | PipelineType.REMOTE_ACCURACY_PARENT_MODEL_TENSOR_DISTANCE
    | PipelineType.DEV_CLOUD_ACCURACY_PARENT_MODEL_TENSOR_DISTANCE;
  targetId: number;
  projectId;
  jobs: [IAccuracyJob];
}
