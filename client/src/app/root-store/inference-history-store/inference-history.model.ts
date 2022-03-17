import { IInferenceExecutionInfo } from '@store/inference-result-store/inference-result.model';
import { ModelDomain, THROUGHPUT_UNIT } from '@store/model-store/model.model';

import { DeviceTargets, DeviceTargetType } from '@shared/models/device';
import { IJob, JobType } from '@shared/models/pipelines/pipeline';

import { ProjectStatus } from '../project-store/project.model';

export interface ICompoundInference extends IJob {
  projectId: number;
  originalModelId: number;
  type: JobType.profiling_job;
  deviceType: DeviceTargets;
  inferenceTime: number;
  inferences: IInferenceResult[];
  created: number;
  started: number;
  updated: number;
  status: ProjectStatus;
}

export interface IInferenceResult extends IInferenceExecutionInfo {
  id: number;
  profilingJobId: number;
  projectId: number;
  status: ProjectStatus;
  created: number;
  started: number;
  updated: number;
  deviceType: DeviceTargets;
  inferenceTime: number;
}

export class InferenceUtils {
  static readonly defaultInferenceTime = 20;
  static readonly shortenInferenceTime = 6;
  static readonly defaultTimeMultiplier = 1;
  static readonly deviceTimeMultipliers = {
    [DeviceTargets.CPU]: 1,
    [DeviceTargets.GPU]: 1.5,
    [DeviceTargets.MYRIAD]: 1.25,
    [DeviceTargets.HDDL]: 1.25,
  };

  static calcEstimatedInferenceTime(
    deviceType: DeviceTargetType,
    inferenceTime: number = InferenceUtils.defaultInferenceTime
  ): number {
    const deviceMultiplier = InferenceUtils.deviceTimeMultipliers[deviceType] || InferenceUtils.defaultTimeMultiplier;
    return Math.ceil(deviceMultiplier * inferenceTime * 2 * 1000);
  }

  static getThroughputUnit(domain: ModelDomain = ModelDomain.CV): THROUGHPUT_UNIT {
    return domain === ModelDomain.CV ? THROUGHPUT_UNIT.FPS : THROUGHPUT_UNIT.SPS;
  }
}
