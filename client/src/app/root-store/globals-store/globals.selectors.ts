import { createFeatureSelector, createSelector } from '@ngrx/store';

import { State as GlobalsState, SupportedFeaturesPreview } from './globals.state';
import { State as AppState } from '../state';

export const selectGlobalsState = createFeatureSelector<GlobalsState>('globals');

const getTaskIsRunning = (state: GlobalsState) => state.isRunning;
const getConnectionStatus = (state: GlobalsState) => state.isConnected;
const getVersion = (state: GlobalsState) => state.version;
const getPackageSizesInfo = (state: GlobalsState) => state.packageSizes;
const getUserMetaInfo = (state: GlobalsState) => state.userMeta;
const getDevCloudMetadata = (state: GlobalsState) => state.devCloudMetadata;
const getTabId = (state: GlobalsState) => state.tabId;
const getFrameworksAvailability = (state: GlobalsState) => state.frameworksAvailability;
const getEnvironmentSetup = (state: GlobalsState) => state.environmentSetup;

export const selectLocalStateTaskIsRunning = createSelector(selectGlobalsState, getTaskIsRunning);

export const selectConnectionStatusState = createSelector(selectGlobalsState, getConnectionStatus);
export const selectVersion = createSelector(selectGlobalsState, getVersion);

export const selectPackageSizesInfo = createSelector(selectGlobalsState, getPackageSizesInfo);

export const selectUserMetaInfo = createSelector(selectGlobalsState, getUserMetaInfo);

export const selectDevCloudMetadata = createSelector(selectGlobalsState, getDevCloudMetadata);

export const selectIsDevCloudMode = createSelector(selectDevCloudMetadata, ({ isDevCloudMode }) => isDevCloudMode);

export const selectIsDevCloudNotAvailable = createSelector(
  selectDevCloudMetadata,
  ({ isDevCloudMode, isDevCloudAvailable }) => isDevCloudMode && !isDevCloudAvailable
);

export const selectTabId = createSelector(selectGlobalsState, getTabId);

export const selectSession = createSelector(selectGlobalsState, (state) => state.session);

export const selectIsJupyterAvailable = createSelector(selectGlobalsState, (state) => state.isJupyterAvailable);

export const selectIsAuthEnabled = createSelector(selectGlobalsState, (state) => state.isAuthEnabled);

export const selectTaskIsRunning = createSelector(selectLocalStateTaskIsRunning, (isRunning) => isRunning);

export const selectFrameworksAvailability = createSelector(selectGlobalsState, getFrameworksAvailability);

export const selectIsFeaturePreviewSupported = (feature: SupportedFeaturesPreview) =>
  createSelector(selectGlobalsState, (state) => !!state.supportedFeaturesPreview?.has(feature));

export const selectEnvironmentSetup = createSelector(selectGlobalsState, getEnvironmentSetup);
