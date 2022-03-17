import { random } from 'lodash';

import { DeviceTargets } from '@shared/models/device';

import { ModelAnalysis, ModelPrecisionEnum, THROUGHPUT_UNIT } from '../model-store/model.model';
import {
  OptimizationJobTypes,
  ProjectConfigParameters,
  ProjectExecInfo,
  ProjectItem,
  ProjectItemDTO,
  ProjectStatusNames,
} from './project.model';

function randomDateStringTillNow(start: Date = new Date(2018, 0, 1)): string {
  const date = new Date(start.getTime() + Math.random() * (new Date().getTime() - start.getTime()));
  const addZeroPrefix = (n) => (n < 10 ? `0${n}` : n);
  const d = date.getDay();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  const h = date.getHours();
  const M = date.getMinutes();
  return `${[d, m, y].map(addZeroPrefix).join('/')} ${[h, M].map(addZeroPrefix).join(':')}`;
}

const mockProjectItemCommonFields = {
  originalModelId: 1,
  analysisData: {
    gFlops: 1,
    mParams: 1,
    minimumMemory: 1,
    maximumMemory: 1,
  } as ModelAnalysis,
  isAccuracyAvailable: true,
  isModelDownloadingAvailable: true,
  hasRawAccuracyConfig: false,
  jupyterNotebookPath: null,
  optimizationImprovements: {
    modelSize: null,
    performance: null,
  },
};

export const mockProjectIds = {
  root0: 1,
  root0_A: 2,
  root0_B: 3,
  root1: 4,
  root1_A: 5,
};

export const mockProjectItemDTOList: ProjectItemDTO[] = [
  {
    id: mockProjectIds.root0,
    modelId: 1,
    modelName: 'SqueezeNet',
    datasetId: 1,
    datasetName: 'ImagenetTest1',
    targetId: 1,
    targetName: 'Local Machine',
    deviceId: 1,
    deviceType: DeviceTargets.CPU,
    deviceName: 'CPU',
    parentId: null,
    creationTimestamp: randomDateStringTillNow(),
    status: {
      name: ProjectStatusNames.READY,
    },
    runtimePrecisions: [ModelPrecisionEnum.FP32],
    execInfo: {
      throughput: random(5, 95),
      latency: random(50, 800),
      accuracy: +random(0.0, 100.0, true).toFixed(2),
    } as ProjectExecInfo,
    configParameters: {
      optimizationType: OptimizationJobTypes.PROFILING,
      minAccDrop: +random(0.1, 1.0).toFixed(2),
      height: random(10, 99),
      width: random(10, 99),
    } as ProjectConfigParameters,
    ...mockProjectItemCommonFields,
  },
  {
    id: mockProjectIds.root0_A,
    modelId: 1,
    modelName: 'SqueezeNet',
    datasetId: 1,
    datasetName: 'ImagenetTest1',
    targetId: 1,
    targetName: 'Local Machine',
    deviceId: 1,
    deviceName: 'CPU',
    deviceType: DeviceTargets.CPU,
    runtimePrecisions: [ModelPrecisionEnum.FP32],
    parentId: mockProjectIds.root0,
    execInfo: {
      throughput: random(5, 95),
      latency: random(50, 800),
      accuracy: +random(0.0, 100.0, true).toFixed(2),
    } as ProjectExecInfo,
    creationTimestamp: randomDateStringTillNow(),
    configParameters: {
      optimizationType: OptimizationJobTypes.INT_8,
      minAccDrop: +random(0.1, 1.0).toFixed(2),
      height: random(10, 99),
      width: random(10, 99),
    } as ProjectConfigParameters,
    status: {
      name: ProjectStatusNames.ERROR,
      errorMessage: 'Something went wrong',
    },
    ...mockProjectItemCommonFields,
  },
  {
    id: mockProjectIds.root0_B,
    modelId: 1,
    modelName: 'SqueezeNet',
    datasetId: 1,
    datasetName: 'ImagenetTest1',
    deviceId: 1,
    deviceName: 'CPU',
    deviceType: DeviceTargets.CPU,
    targetId: 1,
    targetName: 'Local Machine',
    runtimePrecisions: [ModelPrecisionEnum.FP32],
    parentId: mockProjectIds.root0,
    execInfo: {
      throughput: random(5, 95),
      latency: random(50, 800),
      accuracy: +random(0.0, 100.0, true).toFixed(2),
    } as ProjectExecInfo,
    creationTimestamp: randomDateStringTillNow(),
    configParameters: {
      optimizationType: OptimizationJobTypes.INT_8,
    } as ProjectConfigParameters,
    status: {
      name: ProjectStatusNames.READY,
    },
    ...mockProjectItemCommonFields,
  },
  {
    id: mockProjectIds.root1,
    modelId: 1,
    modelName: 'SqueezeNet',
    datasetId: 2,
    datasetName: 'FacialRec',
    deviceId: 2,
    deviceName: 'GPU',
    deviceType: DeviceTargets.GPU,
    targetId: 1,
    targetName: 'Local Machine',
    runtimePrecisions: [ModelPrecisionEnum.FP32],
    parentId: null,
    execInfo: {
      throughput: random(5, 95),
      latency: random(50, 800),
      accuracy: +random(0.0, 100.0, true).toFixed(2),
    } as ProjectExecInfo,
    creationTimestamp: randomDateStringTillNow(),
    configParameters: {
      optimizationType: OptimizationJobTypes.PROFILING,
    } as ProjectConfigParameters,
    status: {
      name: ProjectStatusNames.READY,
    },
    ...mockProjectItemCommonFields,
  },
  {
    id: mockProjectIds.root1_A,
    modelId: 1,
    modelName: 'SqueezeNet',
    datasetId: 2,
    datasetName: 'FacialRec',
    deviceId: 2,
    deviceName: 'GPU',
    deviceType: DeviceTargets.GPU,
    targetId: 1,
    targetName: 'Local Machine',
    runtimePrecisions: [ModelPrecisionEnum.FP32],
    parentId: mockProjectIds.root1,
    creationTimestamp: randomDateStringTillNow(),
    configParameters: {
      optimizationType: OptimizationJobTypes.INT_8,
    } as ProjectConfigParameters,
    status: {
      name: ProjectStatusNames.QUEUED,
    },
    ...mockProjectItemCommonFields,
  },
];

export const mockProjectItemList: ProjectItem[] = [
  {
    id: mockProjectIds.root0, // 1
    modelId: 1,
    modelName: 'SqueezeNet',
    datasetId: 1,
    datasetName: 'ImagenetTest1',
    targetId: 1,
    targetName: 'Local Workstation',
    deviceId: 1,
    deviceType: DeviceTargets.CPU,
    deviceName: 'CPU',
    runtimePrecisions: [ModelPrecisionEnum.FP32],
    parentId: null,
    execInfo: {
      throughput: 60,
      throughputUnit: THROUGHPUT_UNIT.FPS,
      latency: 441,
      accuracy: 91.91,
    },
    configParameters: {
      optimizationType: OptimizationJobTypes.PROFILING,
      minAccDrop: 0.85,
      height: 33,
      width: 91,
    },
    creationTimestamp: '01/08/2018 19:10',
    status: {
      name: ProjectStatusNames.READY,
    },
    pathFromRoot: [],
    children: [mockProjectIds.root0_A], // root0_A
    isExpanded: true,
    isVisible: true,
    ...mockProjectItemCommonFields,
  },
  {
    id: mockProjectIds.root1, // root0
    modelId: 1,
    modelName: 'SqueezeNet',
    datasetId: 1,
    datasetName: 'ImagenetTest1',
    targetId: 1,
    targetName: 'Local Workstation',
    deviceId: 1,
    deviceType: DeviceTargets.CPU,
    deviceName: 'CPU',
    runtimePrecisions: [ModelPrecisionEnum.FP32],
    parentId: null,
    execInfo: {
      throughput: 60,
      throughputUnit: THROUGHPUT_UNIT.FPS,
      latency: 441,
      accuracy: 91.91,
    },
    configParameters: {
      optimizationType: OptimizationJobTypes.PROFILING,
      minAccDrop: 0.85,
      height: 33,
      width: 91,
    },
    creationTimestamp: '01/08/2018 19:10',
    status: {
      name: ProjectStatusNames.READY,
    },
    pathFromRoot: [],
    children: [
      /*mockProjectIds.root0_A*/
    ], // root0_A
    isExpanded: true,
    isVisible: true,
    ...mockProjectItemCommonFields,
  },
  {
    id: mockProjectIds.root0_A, // root0_A
    modelId: 1,
    modelName: 'SqueezeNet',
    datasetId: 1,
    datasetName: 'ImagenetTest1',
    targetId: 1,
    targetName: 'Local Workstation',
    deviceId: 1,
    deviceType: DeviceTargets.CPU,
    deviceName: 'CPU',
    runtimePrecisions: [ModelPrecisionEnum.FP32],
    parentId: mockProjectIds.root0, // root0
    execInfo: {
      throughput: 46,
      throughputUnit: THROUGHPUT_UNIT.FPS,
      latency: 79,
      accuracy: 94.31,
    },
    configParameters: {
      optimizationType: OptimizationJobTypes.INT_8,
      minAccDrop: 0.18,
      height: 14,
      width: 78,
    },
    creationTimestamp: '01/07/2018 17:14',
    status: {
      name: ProjectStatusNames.ERROR,
      errorMessage: 'Something went wrong',
    },
    pathFromRoot: [mockProjectIds.root0], // root0
    children: [],
    isExpanded: true,
    isVisible: true,
    ...mockProjectItemCommonFields,
  },
];
