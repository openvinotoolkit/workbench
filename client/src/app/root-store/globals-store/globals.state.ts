import { ISession } from '@core/services/api/rest/sync.service';

import { ErrorState } from '@store/state';
import { ModelFrameworks } from '@store/model-store/model.model';

import { DeviceTargets } from '@shared/models/device';

export interface State {
  version: string;
  isRunning: boolean;
  isConnected: boolean;
  packageSizes: PackageSizeInfo | null;
  tabId: string;
  userMeta: UserMetaInfo;
  erase: IEraseState;
  session: ISession;
  devCloudMetadata: DevCloudMetadata;
  isJupyterAvailable: boolean;
  isAuthEnabled: boolean;
  frameworksAvailability: IFrameworksAvailability;
  supportedFeaturesPreview: Set<SupportedFeaturesPreview>;
  uploadingArtifactIds: number[];
  environmentSetup: EnvironmentSetupState;
}

export const initialState: State = {
  version: null,
  isRunning: false,
  isConnected: false,
  packageSizes: null,
  tabId: null,
  userMeta: {
    viewedWarning: false,
    agreedCookies: false,
  },
  erase: {
    isRunning: false,
    error: null,
  },
  session: null,
  devCloudMetadata: {
    isDevCloudMode: null,
    isDevCloudAvailable: null,
  },
  isJupyterAvailable: false,
  isAuthEnabled: false,
  frameworksAvailability: null,
  supportedFeaturesPreview: null,
  uploadingArtifactIds: [],
  environmentSetup: {
    isCancelling: false,
    error: null,
  },
};

export type TargetSizeInfo = {
  [key in DeviceTargets]: number;
};

export interface PackageSizeInfo {
  TARGETS: TargetSizeInfo[];
  DRIVERS: TargetSizeInfo[];
  PYTHON: number;
  IE_COMMON: number;
  INSTALL_SCRIPT: number;
}

export interface UserMetaInfo {
  viewedWarning: boolean;
  agreedCookies: boolean;
}

export interface IEraseState {
  isRunning: boolean;
  error: ErrorState;
}

export interface EnvironmentSetupState {
  isCancelling: boolean;
  error: ErrorState;
}

export interface DevCloudMetadata {
  isDevCloudMode: boolean;
  isDevCloudAvailable: boolean;
}

export enum FrameworksAvailabilityStates {
  NOT_CONFIGURED = 'not_configured',
  CONFIGURING = 'configuring',
  CONFIGURED = 'configured',
}

export interface IFrameworksAvailability {
  data: FrameworksAvailability | null;
  error: ErrorState;
}

export type FrameworksAvailability = {
  [frameworkName in ModelFrameworks]: [frameworkState: FrameworksAvailabilityStates];
};

export enum SupportedFeaturesPreview {
  DYNAMIC_SHAPES = 'DYNAMIC_SHAPES',
  OMZ_REDESIGN = 'OMZ_REDESIGN',
  HUGGING_FACE_MODELS = 'HUGGING_FACE_MODELS',
}
