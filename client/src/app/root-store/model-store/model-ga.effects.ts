import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { filter, mergeMap, tap, withLatestFrom } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { of } from 'rxjs';

import { Categories, GAActions, GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import { ProjectStatusNames } from '@store/project-store/project.model';
import { selectModelById, selectModelByModelOptimizerJobId } from '@store/model-store/model.selectors';
import { RootStoreState } from '@store';
import { modelFrameworkNamesMap } from '@store/model-store/model.model';

import * as ModelStoreActions from './model.actions';

@Injectable()
export class ModelGAEffects {
  updateModelItemOnSocket$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ModelStoreActions.onUploadModelSocket),
        mergeMap(({ data }) => of(data).pipe(withLatestFrom(this.store$.pipe(select(selectModelById, data.id))))),
        //  for some reason ready status is firing twice, here we catch only message when status actually changes
        filter(
          ([{ status }, modelItem]) =>
            status.name === ProjectStatusNames.READY &&
            !!modelItem &&
            modelItem.status.name === ProjectStatusNames.RUNNING
        ),
        tap(([payload, model]) => {
          this.gAnalyticsService.emitUploadModelEvent(payload, model);
        })
      ),
    { dispatch: false }
  );

  convertModelGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ModelStoreActions.convertModel),
        mergeMap((payload) =>
          of(payload).pipe(
            withLatestFrom(
              this.store$.pipe(select(selectModelByModelOptimizerJobId, payload.convertConfig.modelOptimizerJobId))
            )
          )
        ),
        tap(([{ convertConfig }, { originalModelFramework }]) => {
          const { originalChannelsOrder } = convertConfig;
          const framework = modelFrameworkNamesMap[originalModelFramework];
          this.gAnalyticsService.emitEvent(GAActions.CONVERT, Categories.MODEL, { originalChannelsOrder, framework });
        })
      ),
    { dispatch: false }
  );

  changeModelUsageGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ModelStoreActions.updateAccuracyConfig),
        mergeMap((payload) =>
          of(payload).pipe(withLatestFrom(this.store$.pipe(select(selectModelById, payload.modelId))))
        ),
        tap(([{ data }, modelItem]) => {
          if (
            modelItem.accuracyConfiguration.taskType !== data.taskType ||
            modelItem.accuracyConfiguration.taskMethod !== data.taskMethod
          ) {
            this.gAnalyticsService.emitModelUsageChangeEvent(data.taskType, data.taskMethod, modelItem.domain);
          }
        })
      ),
    { dispatch: false }
  );

  downloadModelGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ModelStoreActions.startModelArchiving),
        tap(({ isDerivative }) => {
          this.gAnalyticsService.emitEvent(GAActions.DOWNLOAD, Categories.MODEL, { isDerivative });
        })
      ),
    { dispatch: false }
  );

  errorModelUploadGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ModelStoreActions.startUploadModelFailure, ModelStoreActions.uploadModelFailure),
        tap(({ error }) => {
          this.gAnalyticsService.emitErrorEvent(GAActions.LOCAL_MODEL_UPLOAD, error as string);
        })
      ),
    { dispatch: false }
  );

  errorModelDownloadOMZGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ModelStoreActions.downloadOMZModelFailure),
        tap(({ error }) => this.gAnalyticsService.emitErrorEvent(GAActions.OMZ_DOWNLOAD, error as string))
      ),
    { dispatch: false }
  );

  constructor(
    private gAnalyticsService: GoogleAnalyticsService,
    private actions$: Actions,
    private store$: Store<RootStoreState.State>
  ) {}
}
