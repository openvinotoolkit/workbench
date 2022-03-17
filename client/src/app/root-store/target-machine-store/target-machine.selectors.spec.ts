import { TargetMachineStatusNames, TargetMachineTypes } from '@shared/models/pipelines/target-machines/target-machine';
import { DeviceTargets } from '@shared/models/device';

import { TargetMachineSelectors, TargetMachineStoreState } from './';

const id_1 = 1;
const id_2 = 2;

const name_1 = 'workbench-host';
const name_2 = 'Remote Machine 2';

const mockTargetMachineState = {
  ids: [id_1, id_2],
  entities: {
    [id_1]: {
      targetId: id_1,
      targetType: TargetMachineTypes.LOCAL,
      name: name_1,
      host: '127.0.0.1',
      port: 22,
      username: 'openvino',
      lastConnected: 1588238819114.269,
      lastConnectionStatus: TargetMachineStatusNames.AVAILABLE,
      devices: [
        {
          id: 1,
          targetId: id_1,
          type: DeviceTargets.CPU,
          active: true,
          deviceName: 'CPU',
          productName: 'Intel(R) Core(TM) i7-4770HQ CPU @ 2.20GHz',
          optimizationCapabilities: ['FP32', 'INT8', 'BIN'],
          rangeForAsyncInferRequests: { MIN: 0, MAX: 8, STEP: 1 },
          rangeForStreams: { MIN: 1, MAX: 8, STEP: 1 },
        },
        {
          id: 2,
          targetId: id_1,
          type: DeviceTargets.GPU,
          active: true,
          deviceName: 'GPU',
          productName: 'Intel(R) HD Graphics',
          optimizationCapabilities: ['FP32', 'FP16'],
          rangeForAsyncInferRequests: { MIN: 0, MAX: 8, STEP: 1 },
          rangeForStreams: { MIN: 1, MAX: 8, STEP: 1 },
        },
      ],
      systemResources: {
        cpuUsage: 10,
        ram: {
          total: 100,
          used: 20,
          available: 80,
          percentage: 20,
        },
        disk: {
          total: 100,
          used: 20,
          available: 80,
          percentage: 20,
        },
        swap: {
          total: 100,
          used: 20,
          available: 80,
          percentage: 20,
        },
      },
      machineInfo: {
        os: 'Ubuntu',
        hasRootPrivileges: true,
        hasInternetConnection: true,
        pythonVersion: '3.6',
      },
      httpProxy: {
        host: 'http://proxy-example.com',
        port: 999,
        username: 'root',
        password: 'intel123',
      },
      httpsProxy: {
        host: 'http://proxy-example.com',
        port: 999,
        username: 'root',
        password: 'intel123',
      },
    },
    [id_2]: {
      targetId: id_2,
      targetType: TargetMachineTypes.REMOTE,
      port: 22,
      name: name_2,
      host: '10.125.225.88',
      username: 'root',
      lastConnected: 1588238819114.269,
      lastConnectionStatus: TargetMachineStatusNames.CONFIGURATION_FAILURE,
      devices: [
        {
          id: 1,
          targetId: id_2,
          type: DeviceTargets.CPU,
          active: true,
          deviceName: 'CPU',
          productName: 'Intel(R) Core(TM) i7-4770HQ CPU @ 2.20GHz',
          optimizationCapabilities: ['FP32', 'INT8', 'BIN'],
          rangeForAsyncInferRequests: { MIN: 0, MAX: 8, STEP: 1 },
          rangeForStreams: { MIN: 1, MAX: 8, STEP: 1 },
        },
      ],
      machineInfo: {
        os: 'Ubuntu',
        hasRootPrivileges: false,
        hasInternetConnection: false,
        pythonVersion: '3.8',
      },
      httpProxy: {
        host: 'http://proxy-example.com',
        port: 999,
        username: 'root',
        password: 'intel123',
      },
      systemResources: {
        cpuUsage: 10,
        ram: {
          total: 100,
          used: 20,
          available: 80,
          percentage: 20,
        },
        disk: {
          total: 100,
          used: 20,
          available: 80,
          percentage: 20,
        },
        swap: {
          total: 100,
          used: 20,
          available: 80,
          percentage: 20,
        },
      },
    },
  },
  isLoading: false,
  error: null,
  selectedTarget: id_1,
  pipelines: [],
} as TargetMachineStoreState.State;

describe('Target Machine Selectors', () => {
  it('should select item by id', () => {
    const { entities } = mockTargetMachineState;
    const expectedEntity = entities[id_1];
    expect(TargetMachineSelectors.getSelectedTargetMachineByParam.projector(entities, id_1)).toEqual(expectedEntity);
  });
});
