import { Action, createReducer, on } from '@ngrx/store';

import * as GlobalsActions from './globals.actions';
import * as EraseAllActions from './erase-all.actions';
import * as EnvironmentSetupActions from './environment-setup.actions';
import * as UploadingArtifactsActions from './uploading-artifacts-actions';
import { initialState, State } from './globals.state';

const globalsStoreReducer = createReducer(
  initialState,

  on(GlobalsActions.setTaskIsRunningAction, (state) => ({
    ...state,
    isRunning: true,
  })),
  on(GlobalsActions.resetTaskIsRunningAction, (state) => ({
    ...state,
    isRunning: false,
  })),
  on(GlobalsActions.setTabIdAction, (state, { tabId }) => ({
    ...state,
    tabId,
  })),
  on(GlobalsActions.setInternetConnectionStatusAction, (state, { connected }) => ({
    ...state,
    isConnected: connected,
  })),
  on(GlobalsActions.setVersionAction, (state, { version }) => ({
    ...state,
    version,
  })),
  on(GlobalsActions.setPackageSizesAction, (state, { packageSizes }) => ({
    ...state,
    packageSizes,
  })),
  on(GlobalsActions.setUserMetaAction, (state, { userMeta }) => ({
    ...state,
    userMeta,
  })),
  on(EraseAllActions.eraseAll, (state) => ({
    ...state,
    erase: {
      isRunning: true,
      error: null,
    },
  })),
  on(EraseAllActions.eraseAllFailure, (state, { error }) => ({
    ...state,
    erase: {
      isRunning: false,
      error,
    },
  })),
  on(EraseAllActions.eraseAllSuccess, (state) => ({
    ...state,
    erase: {
      isRunning: false,
      error: null,
    },
  })),
  on(EnvironmentSetupActions.stop, (state) => ({
    ...state,
    environmentSetup: {
      isCancelling: true,
      error: null,
    },
  })),
  on(EnvironmentSetupActions.stopFailure, (state, { error }) => ({
    ...state,
    environmentSetup: {
      isCancelling: false,
      error,
    },
  })),
  on(EnvironmentSetupActions.stopSuccess, (state) => ({
    ...state,
    environmentSetup: {
      isCancelling: false,
      error: null,
    },
  })),
  on(GlobalsActions.setDevCloudMetadataAction, (state, { devCloudMetadata }) => ({
    ...state,
    devCloudMetadata,
  })),
  on(GlobalsActions.setSessionAction, (state, { session }) => ({ ...state, session })),
  on(GlobalsActions.setJupyterAvailability, (state, { isJupyterAvailable }) => ({
    ...state,
    isJupyterAvailable,
  })),
  on(GlobalsActions.setAuthState, (state, { isAuthEnabled }) => ({
    ...state,
    isAuthEnabled,
  })),
  on(GlobalsActions.getFrameworksAvailabilityFailure, (state, { error }) => ({
    ...state,
    frameworksAvailability: {
      error,
      data: null,
    },
  })),
  on(GlobalsActions.setFrameworksAvailability, (state, { frameworksAvailability }) => ({
    ...state,
    frameworksAvailability: {
      error: null,
      data: frameworksAvailability,
    },
  })),
  on(GlobalsActions.getSupportedFeaturesPreviewSuccess, (state, { supportedFeaturesPreview }) => ({
    ...state,
    supportedFeaturesPreview,
  })),

  //  UPLOADING ARTIFACTS

  on(UploadingArtifactsActions.addUploadingArtifactId, (state: State, { id }) => ({
    ...state,
    uploadingArtifactIds: [...state.uploadingArtifactIds, id],
  })),
  on(UploadingArtifactsActions.removeUploadingArtifactId, (state: State, { id }) => ({
    ...state,
    uploadingArtifactIds: state.uploadingArtifactIds.filter((artifactId) => artifactId !== id),
  }))
);

export function reducer(state: State | undefined, action: Action) {
  return globalsStoreReducer(state, action);
}
