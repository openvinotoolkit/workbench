import { isEmpty as _isEmpty } from 'lodash';

import { InferenceUtils } from '@store/inference-history-store/inference-history.model';

export interface IInferenceConfiguration {
  nireq: number;
  batch: number;
}

export class CompoundInferenceConfig {
  datasetId: number;
  modelId: number;
  deviceId: number;
  targetId: number;
  deviceName: string;
  inferences: IInferenceConfiguration[];
  inferenceTime: number;
  parentJobId: number;
  projectId: number;
  binary: boolean;

  constructor(params?: Partial<CompoundInferenceConfig>) {
    if (_isEmpty(params)) {
      return;
    }

    const { deviceId, inferences, datasetId, targetId, modelId, deviceName, inferenceTime, binary } = params;
    this.deviceId = deviceId;
    this.inferences = inferences;
    this.datasetId = datasetId;
    this.targetId = targetId;
    this.modelId = modelId;
    this.deviceName = deviceName;
    this.binary = binary;
    this.inferenceTime = inferenceTime || InferenceUtils.defaultInferenceTime;
  }

  prepareForRest(): CompoundInferenceConfig {
    return {
      datasetId: this.datasetId,
      modelId: this.modelId,
      deviceId: this.deviceId,
      targetId: this.targetId,
      deviceName: this.deviceName,
      inferences: this.inferences,
      inferenceTime: this.inferenceTime,
      parentJobId: this.parentJobId,
      binary: this.binary,
    } as CompoundInferenceConfig;
  }
}
