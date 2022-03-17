import { ICompoundInference } from '@store/inference-history-store/inference-history.model';

import { IJob, IPipeline, PipelineType } from '@shared/models/pipelines/pipeline';

export interface IInt8CalibrationPipeline extends IPipeline {
  type:
    | PipelineType.LOCAL_INT8_CALIBRATION
    | PipelineType.REMOTE_INT8_CALIBRATION
    | PipelineType.DEV_CLOUD_INT8_CALIBRATION;
  jobs: (IJob | ICompoundInference)[];
}
