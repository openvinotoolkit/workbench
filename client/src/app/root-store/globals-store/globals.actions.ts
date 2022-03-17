import { createAction, props } from '@ngrx/store';

import { ISession, SyncResponseDTO } from '@core/services/api/rest/sync.service';

import {
  DevCloudMetadata,
  FrameworksAvailability,
  PackageSizeInfo,
  SupportedFeaturesPreview,
  UserMetaInfo,
} from '@store/globals-store/globals.state';
import { ErrorState } from '@store/state';

export const setTaskIsRunningAction = createAction('[Globals] Set Task Is Running');

export const resetTaskIsRunningAction = createAction('[Globals] Reset Task Is Running');

export const setInternetConnectionStatusAction = createAction(
  '[Globals] Set Internet Connection Status',
  props<{ connected: boolean }>()
);

export const setVersionAction = createAction('[Globals] Set Version', props<{ version: string }>());

export const syncAction = createAction('[Globals] Sync');

export const syncSuccessAction = createAction('[Globals] Sync Success', props<{ syncResponse: SyncResponseDTO }>());

export const syncFailureAction = createAction('[Globals] Sync Failure', props<{ error: ErrorState }>());

export const setPackageSizesAction = createAction(
  '[Globals] Set Package Sizes',
  props<{ packageSizes: PackageSizeInfo }>()
);

export const connectSocketAction = createAction('[Globals] Connect Socket', props<{ rejectUnauthorized: boolean }>());

export const disconnectSocketAction = createAction('[Globals] Disconnect Socket');

export const setTabIdAction = createAction('[Globals] Set Tab ID', props<{ tabId: string }>());

export const setUserMetaAction = createAction('[Globals] Set User Metadata', props<{ userMeta: UserMetaInfo }>());

export const setDevCloudMetadataAction = createAction(
  '[Globals] Set DevCloud Metadata',
  props<{ devCloudMetadata: DevCloudMetadata }>()
);

export const setGACollectingStatusAction = createAction(
  '[Globals] Show Google Analytics Status',
  props<{ agreedCookies: boolean }>()
);

export const setBannerIsViewedAction = createAction('[Globals] Set banner is viewed');

export const setSessionAction = createAction('[Globals] Set session', props<{ session: ISession }>());

export const setJupyterAvailability = createAction(
  '[Globals] Set Jupyter availability',
  props<{ isJupyterAvailable: boolean }>()
);

export const setAuthState = createAction('[Globals] Set auth state', props<{ isAuthEnabled: boolean }>());

export const beforeunload = createAction('[Globals] Before unload', props<{ event: BeforeUnloadEvent }>());

export const unload = createAction('[Globals] Unload');

export const getFrameworksAvailability = createAction('[Globals] Get frameworks availability');

export const getFrameworksAvailabilitySuccess = createAction(
  '[Globals] Get frameworks availability Success',
  props<{ frameworksAvailability: FrameworksAvailability }>()
);

export const getFrameworksAvailabilityFailure = createAction(
  '[Globals] Get frameworks availability Failure',
  props<{ error: ErrorState }>()
);

export const setFrameworksAvailability = createAction(
  '[Globals] Set frameworks availability',
  props<{ frameworksAvailability: FrameworksAvailability }>()
);

export const getSupportedFeaturesPreview = createAction('[Globals] Get supported features preview');

export const getSupportedFeaturesPreviewSuccess = createAction(
  '[Globals] Get supported features preview Success',
  props<{ supportedFeaturesPreview: Set<SupportedFeaturesPreview> }>()
);

export const getSupportedFeaturesPreviewFailure = createAction(
  '[Globals] Get supported features preview Failure',
  props<{ error: ErrorState }>()
);
