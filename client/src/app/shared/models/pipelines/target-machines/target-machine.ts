import { DeviceItem, OSTypeNames } from '@shared/models/device';

export class TargetMachineItem {
  targetId: number;
  targetType: TargetMachineTypesType;
  name: string;
  host: string;
  port: number;
  username: string;
  privateKey?: string;
  privateKeyFileName?: string;
  lastConnected: number;
  lastConnectionStatus: TargetMachineStatusNameType;
  httpProxy?: ProxySettings;
  httpsProxy?: ProxySettings;
  machineInfo?: TargetMachineInformation;
  cpuInfo?: CpuInfo;
  systemResources?: SystemResources;
  devices?: DeviceItem[];
  error?: string;
  operatingSystem?: OSTypeNames;

  static getFullTargetMachineName(targetMachine: TargetMachineItem): string {
    return `${targetMachine.name} • ${targetMachine.username}@${targetMachine.host}`;
  }
}

export enum TargetMachineTypes {
  LOCAL = 'local',
  REMOTE = 'remote',
  DEV_CLOUD = 'dev_cloud',
}

export type TargetMachineTypesType = typeof TargetMachineTypes[keyof typeof TargetMachineTypes];

export const TargetMachineTypesNamesMap = {
  [TargetMachineTypes.LOCAL]: 'Local',
  [TargetMachineTypes.REMOTE]: 'Remote',
  [TargetMachineTypes.DEV_CLOUD]: 'DevCloud',
};

export enum TargetMachineStatusNames {
  AVAILABLE = 'available',
  CONFIGURING = 'configuring',
  CONFIGURATION_FAILURE = 'configuration_failure',
  CONNECTING = 'connecting',
  CONNECTION_FAILURE = 'connection_failure',
  NOT_CONFIGURED = 'not_configured',
  BUSY = 'busy',
}

export type TargetMachineStatusNameType = typeof TargetMachineStatusNames[keyof typeof TargetMachineStatusNames];

export class ProxySettings {
  host: string;
  port: number;
  username?: string;
  password?: string;

  static getProxyUrl(proxy: ProxySettings): string {
    if (!proxy) {
      return null;
    }
    const protocolDelimiter = '://';
    const { host, port, username, password } = proxy;
    const [protocol, hostName] = host.split(protocolDelimiter);
    const credentials = username && `${username}${password && ':****'}`;
    if (!hostName) {
      const hostIpAndPort = `${host}:${port}`;
      return credentials ? `${credentials}@${hostIpAndPort}` : hostIpAndPort;
    }
    const hostNameAndPort = `${hostName}:${port}`;
    return `${protocol}${protocolDelimiter}${credentials ? `${credentials}@${hostNameAndPort}` : hostNameAndPort}`;
  }
}

export enum CpuPlatformType {
  CELERON = 'celeron',
  ATOM = 'atom',
  PENTIUM = 'pentium',
  CORE = 'core',
  XEON = 'xeon',
  NOT_RECOGNIZED = 'not_recognized',
}

export const CpuPlatformTypeNamesMap = {
  [CpuPlatformType.CELERON]: 'Intel Celeron',
  [CpuPlatformType.ATOM]: 'Intel Atom',
  [CpuPlatformType.PENTIUM]: 'Intel Pentium',
  [CpuPlatformType.CORE]: 'Intel Core',
  [CpuPlatformType.XEON]: 'Intel Xeon',
  [CpuPlatformType.NOT_RECOGNIZED]: 'Not Recognized',
};

export interface CpuInfo {
  platformType: CpuPlatformType;
  name: string;
  processorFamily: string;
  processorNumber?: string;
  coresNumber: number;
  frequency: string | null;
}

export interface SystemResources {
  cpuUsage: number;
  ram: SystemResourceDetails;
  disk: SystemResourceDetails;
  swap: SystemResourceDetails;
}

export interface SystemResourceDetails {
  total: number;
  used: number;
  available: number;
  percentage: number;
}

export interface TargetMachineInformation {
  os: string;
  hasRootPrivileges: boolean;
  hasInternetConnection: boolean;
  pythonVersion: string;
}
