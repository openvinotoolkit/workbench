import { InputConfiguration, ShapeType } from '@store/model-store/model.model';

import { IJob, IPipeline, JobType, PipelineType } from '@shared/models/pipelines/pipeline';

export interface IReshape extends IJob {
  type: JobType.reshape_job;
  modelId: number;
  shapeConfiguration: { id: number; isOriginal: boolean; shape: InputConfiguration; shapeType: ShapeType };
}

export interface IConfigure extends IJob {
  type: JobType.apply_model_layout_job;
  modelId: number;
  layout: { data: number; index: number; layout: string[] };
}

export interface IConfigurePipeline extends IPipeline {
  type: PipelineType.CONFIGURE_MODEL;
  jobs: [IReshape, IConfigure];
}
