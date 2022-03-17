import { OptimizationAlgorithm, OptimizationAlgorithmPreset } from '@store/project-store/project.model';

import { CompoundInferenceConfig } from './compound-inference-config';

export interface Int8CalibrationConfig {
  int8CalibrationConfig: {
    modelId: number;
    datasetId: number;
    deviceId: number;
    targetId: number;
    batch: number;
    subsetSize: number;
    algorithm: OptimizationAlgorithm;
    preset: OptimizationAlgorithmPreset;
    threshold?: number;
  };
  profilingConfig: CompoundInferenceConfig;
}
