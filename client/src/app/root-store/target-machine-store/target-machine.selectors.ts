import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Dictionary } from '@ngrx/entity';
import { compact, flatMap, isEmpty, mapValues, reduce } from 'lodash';

import { State as AppState } from '@store/state';
import {
  State as TargetMachineState,
  targetMachineItemAdapter,
} from '@store/target-machine-store/target-machine.state';
import { getMergedRoute, selectParamTargetId, selectQueryParamTargetId } from '@store/router-store/route.selectors';
import { ProjectItem } from '@store/project-store/project.model';

import { DeviceItem } from '@shared/models/device';
import {
  CpuPlatformType,
  TargetMachineItem,
  TargetMachineStatusNames,
  TargetMachineTypes,
} from '@shared/models/pipelines/target-machines/target-machine';

import * as fromTargetMachineStore from './target-machine.reducer';

const selectTargetMachineState = createFeatureSelector<AppState, TargetMachineState>(
  fromTargetMachineStore.targetMachineStoreFeatureKey
);

export const selectTargetMachineEntities: (
  state: AppState
) => Dictionary<TargetMachineItem> = targetMachineItemAdapter.getSelectors(selectTargetMachineState).selectEntities;

export const getSelectedTargetMachine = (state: TargetMachineState): number => state.selectedTarget;

export const selectAllTargetMachines: (state: AppState) => TargetMachineItem[] = targetMachineItemAdapter.getSelectors(
  selectTargetMachineState
).selectAll;

export const selectAvailablePlatforms = createSelector(selectAllTargetMachines, (targetMachines: TargetMachineItem[]) =>
  targetMachines.reduce((acc, { cpuInfo }) => {
    if (cpuInfo && !acc.includes(cpuInfo.platformType)) {
      acc.push(cpuInfo.platformType);
    }
    return acc;
  }, [] as CpuPlatformType[])
);

export const selectTargetMachinesForPlatform = createSelector(
  selectAllTargetMachines,
  (targetMachines: TargetMachineItem[], basePlatform: CpuPlatformType) =>
    targetMachines.filter(({ cpuInfo, lastConnectionStatus }) => {
      if (!basePlatform) {
        return true;
      }
      if (!cpuInfo || lastConnectionStatus === TargetMachineStatusNames.NOT_CONFIGURED) {
        return false;
      }
      return cpuInfo.platformType === basePlatform;
    })
);

export const getSelectedTargetMachineByParam = createSelector(
  selectTargetMachineEntities,
  selectParamTargetId,
  (itemsMap: Dictionary<TargetMachineItem>, id: number) => (!isEmpty(itemsMap) ? itemsMap[id] : null)
);

export const selectTargetMachineById = createSelector(
  selectTargetMachineEntities,
  (itemsMap: Dictionary<TargetMachineItem>, id: number) => (!isEmpty(itemsMap) ? itemsMap[id] : null)
);

export const selectLocalTargetMachine = createSelector(selectAllTargetMachines, (targetMachines: TargetMachineItem[]) =>
  targetMachines.find(({ targetType }) => targetType === TargetMachineTypes.LOCAL)
);

export const selectDevicesForTarget = createSelector(selectTargetMachineById, (targetMachine: TargetMachineItem) =>
  targetMachine && targetMachine.devices ? targetMachine.devices : []
);

export const selectActiveDevicesForTarget = createSelector(selectDevicesForTarget, (devices) =>
  devices.filter((device) => device.active)
);

function createItemsMap<T, TKey extends keyof T>(items: T[], idKey: TKey): Dictionary<T> {
  return reduce<T, Dictionary<T>>(
    items,
    (acc, item) => {
      acc[item[idKey].toString()] = item;
      return acc;
    },
    {}
  );
}

export const selectAvailableOptimizationsForTarget = createSelector(selectDevicesForTarget, (devices) => {
  const devicesMap = createItemsMap(devices, 'id');
  return mapValues(devicesMap, ({ optimizationCapabilities }) => optimizationCapabilities);
});

function getTargetDevicesMap(targetMachines: TargetMachineItem[]): Dictionary<DeviceItem> {
  const allDevices = compact<DeviceItem>(
    flatMap<TargetMachineItem, DeviceItem>(targetMachines, ({ devices }) => devices)
  );
  return createItemsMap(allDevices, 'id');
}

export const selectAllDevicesMap = createSelector(selectAllTargetMachines, (targetMachines) =>
  getTargetDevicesMap(targetMachines)
);

export const selectAllDevicesNamesMap = createSelector(selectAllDevicesMap, (devicesMap) =>
  mapValues(devicesMap, ({ productName }) => productName)
);

export const selectDeviceByQueryParams = createSelector(
  getMergedRoute,
  selectAllDevicesMap,
  (route, devices) => devices[route.queryParams.deviceId]
);

export const getSelectedTargetMachineByQueryParam = createSelector(
  selectTargetMachineEntities,
  selectQueryParamTargetId,
  (itemsMap: Dictionary<TargetMachineItem>, id) => (!isEmpty(itemsMap) ? itemsMap[id] : null)
);

export const selectSelectedTargetMachineId = createSelector(selectTargetMachineState, getSelectedTargetMachine);

export const selectTargetMachineStatusesMap = createSelector(selectTargetMachineEntities, (targetMachinesMap) => {
  return mapValues(targetMachinesMap, ({ lastConnectionStatus }) => lastConnectionStatus);
});

export const selectProjectDevice = createSelector(
  selectTargetMachineEntities,
  (targetMachinesMap, project: ProjectItem) => {
    if (!project || !targetMachinesMap[project.targetId]) {
      return null;
    }
    return targetMachinesMap[project.targetId].devices.find((i) => i.id === project.deviceId);
  }
);
