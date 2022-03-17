import { startsWith } from 'lodash';

export interface DeviceRange {
  MAX: number;
  MIN: number;
  STEP: number;
}

export enum DeviceTargets {
  CPU = 'CPU',
  GPU = 'GPU',
  MYRIAD = 'MYRIAD',
  HDDL = 'HDDL',
}

export enum OSTypeNames {
  UBUNTU18 = 'ubuntu18',
  UBUNTU20 = 'ubuntu20',
}

export type DeviceTargetType = typeof DeviceTargets[keyof typeof DeviceTargets];
export type TargetOSType = typeof OSTypeNames[keyof typeof OSTypeNames];

// TODO replace with usual deviceType check
export function isVPU(deviceName: string): boolean {
  return startsWith(deviceName, DeviceTargets.MYRIAD);
}

export interface DeviceItem {
  id: number;
  targetId: number;
  type: DeviceTargets;
  active: boolean;
  productName: string;
  deviceName: string;
  optimizationCapabilities: string[];
  rangeForAsyncInferRequests: DeviceRange;
  rangeForStreams?: DeviceRange;
}

export class DeviceItemUtils {
  static getMaxStreams(device: DeviceItem): number {
    const shouldUseInfers = isVPU(device.deviceName) || device.deviceName === DeviceTargets.HDDL;
    const range = shouldUseInfers ? device.rangeForAsyncInferRequests : device.rangeForStreams;
    return shouldUseInfers ? range.MAX : range.MAX * 2;
  }

  static getMinStreams(device: DeviceItem): number {
    const shouldUseInfers = isVPU(device.deviceName) || device.deviceName === DeviceTargets.HDDL;
    const range = shouldUseInfers ? device.rangeForAsyncInferRequests : device.rangeForStreams;
    return range.MIN;
  }
}
