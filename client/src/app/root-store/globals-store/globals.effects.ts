import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { Action, select, Store } from '@ngrx/store';

import { SyncResponseDTO, SyncService } from '@core/services/api/rest/sync.service';
import { BackendFeedService } from '@core/services/common/backend-feed.service';
import { ConnectionService } from '@core/services/api/connection.service';
import { CommonRestService } from '@core/services/api/rest/common-rest.service';
import { WindowService } from '@core/services/common/window.service';
import { EnvironmentService } from '@core/services/api/rest/environment.service';

import { AccuracyAnalysisStoreActions, RootStoreState } from '@store';
import * as InferenceTestImageStoreSelectors from '@store/inference-test-image-store/inference-test-image.selectors';
import { ModelStoreActions } from '@store/model-store';
import { DatasetStoreActions } from '@store/dataset-store';
import { InferenceHistoryStoreActions } from '@store/inference-history-store';
import * as ProjectActions from '@store/project-store/project.actions';
import * as DeployActions from '@store/project-store/deployment.actions';
import { selectUploadingDatasetIds } from '@store/dataset-store/dataset.selectors';
import { selectAccessToken } from '@store/auth-store/auth-store.selectors';
import { selectUploadingModelIds } from '@store/model-store/model.selectors';
import { TargetMachineActions } from '@store/target-machine-store';
import * as Int8CalibrationActions from '@store/project-store/int8-calibration.actions';
import * as ExportProjectActions from '@store/project-store/export-project.actions';

import * as UploadingArtifactsSelectors from './uploading-artifacts-selectors';
import { ProjectStatusNames } from '../project-store/project.model';
import { selectTaskIsRunning } from './globals.selectors';
import * as GlobalsStoreActions from './globals.actions';
import { beforeunload, unload } from './globals.actions';

@Injectable()
export class GlobalsEffects {
  updateFlagOnSocketMessages$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectActions.onAccuracySocketMessage, InferenceHistoryStoreActions.onProfilingSocketMessage),
      map(({ type, message }) => {
        const { status } = message;
        const setTaskIsRunning = true;
        if (
          ((type === InferenceHistoryStoreActions.onProfilingSocketMessage.type ||
            type === ProjectActions.onAccuracySocketMessage.type) &&
            status.name === ProjectStatusNames.READY) ||
          status.name === ProjectStatusNames.ERROR ||
          status.name === ProjectStatusNames.CANCELLED ||
          status.errorMessage
        ) {
          return !setTaskIsRunning;
        }
        return setTaskIsRunning;
      }),
      withLatestFrom(this.store$.pipe(select(selectTaskIsRunning))),
      filter(([newTaskIsRunning, currentTaskIsRunning]) => newTaskIsRunning !== currentTaskIsRunning),
      map(([setNewTaskIsRunning]) =>
        setNewTaskIsRunning
          ? GlobalsStoreActions.setTaskIsRunningAction()
          : GlobalsStoreActions.resetTaskIsRunningAction()
      )
    )
  );

  sync$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(GlobalsStoreActions.syncAction),
      switchMap(() =>
        this.syncService.sync$().pipe(
          map((syncResponse) => GlobalsStoreActions.syncSuccessAction({ syncResponse })),
          catchError((error) => of(GlobalsStoreActions.syncFailureAction({ error })))
        )
      )
    );
  });

  syncSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(GlobalsStoreActions.syncSuccessAction),
      switchMap(({ syncResponse }: { syncResponse: SyncResponseDTO }) => {
        this.backendFeedService.setData(syncResponse);
        const {
          taskIsRunning,
          version,
          predefinedTransformationsConfigs,
          internetConnection,
          packageSizes,
          rejectUnauthorized,
          userMeta,
          runningProfilingPipelines,
          runningAccuracyPipelines,
          runningInt8CalibrationPipelines,
          isDevCloudMode,
          isDevCloudAvailable,
          session,
          isJupyterAvailable,
          isAuthEnabled,
        } = syncResponse;
        const tabId = this.connectionService.tabId;
        const actionsToDispatch: Action[] = [
          ModelStoreActions.loadModels(),
          TargetMachineActions.loadTargetMachines(),
          DatasetStoreActions.loadDatasets(),
          GlobalsStoreActions.setInternetConnectionStatusAction({ connected: internetConnection }),
          GlobalsStoreActions.setVersionAction({ version }),
          GlobalsStoreActions.setPackageSizesAction({ packageSizes }),
          GlobalsStoreActions.setTabIdAction({ tabId }),
          GlobalsStoreActions.connectSocketAction({ rejectUnauthorized }),
          GlobalsStoreActions.setUserMetaAction({ userMeta }),
          GlobalsStoreActions.setSessionAction({ session }),
          GlobalsStoreActions.setJupyterAvailability({ isJupyterAvailable }),
          GlobalsStoreActions.setAuthState({ isAuthEnabled }),
          GlobalsStoreActions.setDevCloudMetadataAction({
            devCloudMetadata: {
              isDevCloudMode,
              isDevCloudAvailable,
            },
          }),
          InferenceHistoryStoreActions.upsertRunningProfiling({
            data: runningProfilingPipelines,
          }),
          AccuracyAnalysisStoreActions.upsertAccuracyPipeline({ data: runningAccuracyPipelines }),
          Int8CalibrationActions.upsertInt8CalibrationPipeline({
            data: runningInt8CalibrationPipelines,
          }),
        ];

        if (taskIsRunning) {
          actionsToDispatch.push(GlobalsStoreActions.setTaskIsRunningAction());
        }
        if (predefinedTransformationsConfigs) {
          actionsToDispatch.push(
            ModelStoreActions.setAvailableModelTransformationsConfigs({ configs: predefinedTransformationsConfigs })
          );
        }
        return actionsToDispatch;
      })
    );
  });

  updateFlag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DeployActions.onDeploySocketMessage, Int8CalibrationActions.onInt8CalibrationPipelineSocketMessage),
      map((action) => {
        const setTaskIsRunning = true;
        const { status } = action.message;
        if (
          status.name === ProjectStatusNames.READY ||
          status.name === ProjectStatusNames.ERROR ||
          status.errorMessage
        ) {
          return !setTaskIsRunning;
        }
        return setTaskIsRunning;
      }),
      withLatestFrom(this.store$.pipe(select(selectTaskIsRunning))),
      filter(([newTaskIsRunning, currentTaskIsRunning]) => newTaskIsRunning !== currentTaskIsRunning),
      map(([setNewTaskIsRunning]) =>
        setNewTaskIsRunning
          ? GlobalsStoreActions.setTaskIsRunningAction()
          : GlobalsStoreActions.resetTaskIsRunningAction()
      )
    )
  );

  updateFlagOnExportProjectSocketMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ExportProjectActions.onExportSocketMessage),
      map((action) => {
        const { status } = action.message;
        return (
          status.name !== ProjectStatusNames.READY && status.name !== ProjectStatusNames.ERROR && !status.errorMessage
        );
      }),
      withLatestFrom(this.store$.pipe(select(selectTaskIsRunning))),
      filter(([newTaskIsRunning, currentTaskIsRunning]) => newTaskIsRunning !== currentTaskIsRunning),
      map(([setNewTaskIsRunning]) =>
        setNewTaskIsRunning
          ? GlobalsStoreActions.setTaskIsRunningAction()
          : GlobalsStoreActions.resetTaskIsRunningAction()
      )
    )
  );

  getFrameworksAvailability$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(GlobalsStoreActions.getFrameworksAvailability),
      switchMap(() =>
        this.environmentService.getFrameworks$().pipe(
          map((frameworksAvailability) =>
            GlobalsStoreActions.getFrameworksAvailabilitySuccess({ frameworksAvailability })
          ),
          catchError((error) => of(GlobalsStoreActions.getFrameworksAvailabilityFailure({ error })))
        )
      )
    );
  });

  getFrameworksAvailabilitySuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(GlobalsStoreActions.getFrameworksAvailabilitySuccess),
      map(({ frameworksAvailability }) => GlobalsStoreActions.setFrameworksAvailability({ frameworksAvailability }))
    );
  });

  getSupportedFeaturesPreview$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(GlobalsStoreActions.getSupportedFeaturesPreview),
      switchMap(() =>
        this.environmentService.getSupportedFeaturesPreview$().pipe(
          map((features) =>
            GlobalsStoreActions.getSupportedFeaturesPreviewSuccess({ supportedFeaturesPreview: new Set(features) })
          ),
          catchError((error) => of(GlobalsStoreActions.syncFailureAction({ error })))
        )
      )
    );
  });

  unload$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(unload),
        withLatestFrom(
          this.store$.select(selectUploadingDatasetIds),
          this.store$.select(selectUploadingModelIds),
          this.store$.select(InferenceTestImageStoreSelectors.selectInferingPipeline),
          this.store$.select(UploadingArtifactsSelectors.selectUploadingArtifactIds),
          this.store$.select(selectAccessToken)
        ),
        filter(
          ([_, datasetIds, modelIds, testImagePipeline, uploadingIds]) =>
            !!datasetIds.length || !!modelIds.length || !!testImagePipeline || !!uploadingIds.length
        ),
        map(([_, datasetIds, modelIds, testImagePipeline, uploadingIds, accessToken]) => {
          this.commonRestService.unload(accessToken, {
            datasetIds,
            modelIds,
            uploadingIds,
            pipelineIds: [testImagePipeline.id],
          });
        })
      ),
    { dispatch: false }
  );

  beforeunload$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(beforeunload),
        withLatestFrom(
          this.store$.select(selectUploadingDatasetIds),
          this.store$.select(selectUploadingModelIds),
          this.store$.select(InferenceTestImageStoreSelectors.selectInfering),
          this.store$.select(UploadingArtifactsSelectors.selectUploadingArtifactIds)
        ),
        filter(
          ([_, datasetIds, modelIds, testImageInfering, uploadingIds]) =>
            !!datasetIds.length || !!modelIds.length || testImageInfering || !!uploadingIds.length
        ),
        map(([{ event }]) => {
          event.preventDefault();
          event.returnValue = '';
        })
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private syncService: SyncService,
    private backendFeedService: BackendFeedService,
    private connectionService: ConnectionService,
    private commonRestService: CommonRestService,
    private windowService: WindowService,
    private environmentService: EnvironmentService
  ) {
    this.windowService.initialize();
  }
}
