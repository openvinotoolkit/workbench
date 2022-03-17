import { ICompoundInference } from '@store/inference-history-store/inference-history.model';

import { IJob, IPipeline, PipelineType } from '@shared/models/pipelines/pipeline';

export interface IProfilingPipeline extends IPipeline {
  type: PipelineType.LOCAL_PROFILING | PipelineType.REMOTE_PROFILING | PipelineType.DEV_CLOUD_PROFILING;
  jobs: (IJob | ICompoundInference)[];
}
