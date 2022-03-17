import { keys } from 'lodash';
import { Action } from '@ngrx/store';

import {
  TargetMachineItem,
  TargetMachineStatusNames,
  TargetMachineTypes,
} from '@shared/models/pipelines/target-machines/target-machine';
import { DeviceTargets } from '@shared/models/device';

import { reducer } from './target-machine.reducer';
import { initialState } from './target-machine.state';
import { TargetMachineActions, TargetMachineReducer } from './';

export const mockedTargetMachines: TargetMachineItem[] = [
  {
    targetId: 1,
    targetType: TargetMachineTypes.LOCAL,
    name: 'workbench-host',
    host: '127.0.0.1',
    port: 22,
    username: 'openvino',
    lastConnected: 1588238819114.269,
    lastConnectionStatus: TargetMachineStatusNames.AVAILABLE,
    devices: [
      {
        id: 1,
        targetId: 1,
        type: DeviceTargets.CPU,
        active: true,
        deviceName: 'CPU',
        productName: 'Intel(R) Core(TM) i7-4770HQ CPU @ 2.20GHz',
        optimizationCapabilities: ['FP32', 'INT8', 'BIN'],
        rangeForAsyncInferRequests: { MIN: 0, MAX: 8, STEP: 1 },
        rangeForStreams: { MIN: 1, MAX: 8, STEP: 1 },
      },
      {
        id: 1,
        targetId: 1,
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
  {
    targetId: 2,
    targetType: TargetMachineTypes.REMOTE,
    port: 22,
    name: 'Remote Machine 1',
    host: '10.125.225.88',
    username: 'root',
    lastConnected: 1588238819114.269,
    lastConnectionStatus: TargetMachineStatusNames.CONFIGURATION_FAILURE,
    devices: [
      {
        id: 1,
        targetId: 2,
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
  {
    targetId: 3,
    targetType: TargetMachineTypes.REMOTE,
    port: 22,
    name: 'Remote Machine 2',
    host: '45.112.167.12',
    username: 'root',
    lastConnected: 1588237181941.269,
    lastConnectionStatus: TargetMachineStatusNames.CONNECTION_FAILURE,
    httpProxy: {
      host: 'http://proxy-example.com',
      port: 999,
      username: 'root',
      password: 'intel123',
    },
  },
];

describe('Target Machine Reducer', () => {
  describe('an unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = reducer(initialState, action);

      expect(result).toBe(initialState);
    });
  });

  describe('Load machines action', () => {
    it('should set loading to true', () => {
      const action = TargetMachineActions.loadTargetMachines();

      const state = TargetMachineReducer(initialState, action);

      expect(state.isLoading).toEqual(true);
      expect(state.entities).toEqual({});
    });
  });

  describe('Load machines failure action', () => {
    it('should set error', () => {
      const error = { message: 'Error' };
      const action = TargetMachineActions.loadTargetMachinesFailure({ error });

      const loadAction = TargetMachineActions.loadTargetMachines();
      const previousState = TargetMachineReducer(initialState, loadAction);
      const state = TargetMachineReducer(previousState, action);

      expect(state.error).toEqual(error);
      expect(state.isLoading).toEqual(false);
      expect(state.entities).toEqual({});
    });
  });

  describe('Load machines success action', () => {
    it('should set all items', () => {
      const action = TargetMachineActions.loadTargetMachinesSuccess({ targetMachines: mockedTargetMachines });

      const loadAction = TargetMachineActions.loadTargetMachines();
      const previousState = TargetMachineReducer(initialState, loadAction);
      const state = TargetMachineReducer(previousState, action);

      expect(keys(state.entities).length).toEqual(mockedTargetMachines.length);
      expect(state.ids.length).toEqual(mockedTargetMachines.length);

      expect(state.isLoading).toEqual(false);
    });
  });
});
