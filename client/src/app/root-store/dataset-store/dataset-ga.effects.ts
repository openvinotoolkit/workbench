import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { filter, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';

import { Categories, GAActions, GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import { ProjectStatusNames } from '@store/project-store/project.model';
import { DatasetTypes, DatasetTypeToNameMap } from '@store/dataset-store/dataset.model';
import { RootStoreState } from '@store';
import * as DatasetStoreSelectors from '@store/dataset-store/dataset.selectors';

import * as DatasetActions from './dataset.actions';

@Injectable()
export class DatasetGAEffects {
  reportDatasetUploadGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DatasetActions.onUploadDatasetSocket),
        switchMap(({ data }) =>
          of(data).pipe(withLatestFrom(this.store$.select(DatasetStoreSelectors.selectDatasetById, data.id)))
        ),
        // in case if there is a few sockets with ready status are coming, catch the one that actually changes status
        filter(
          ([{ status }, dataset]) =>
            status?.name === ProjectStatusNames.READY &&
            dataset?.status?.name === ProjectStatusNames.RUNNING &&
            dataset?.type !== DatasetTypes.CSV
        ),
        tap(([payload]) => {
          const { type, originalType, date } = payload;
          const time = GoogleAnalyticsService.getJobExecTime(date);
          this.gAnalyticsService.emitEvent('Local-Upload', Categories.DATASET, {
            type: DatasetTypeToNameMap[type],
            originalDatasetType: DatasetTypeToNameMap[originalType],
            time,
          });
        })
      ),
    { dispatch: false }
  );

  reportDatasetCreationGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DatasetActions.createNADataset),
        tap(({ dataset }) => this.gAnalyticsService.emitDatasetCreate(dataset.augmentationConfig))
      ),
    { dispatch: false }
  );

  errorDatasetUploadGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DatasetActions.startUploadDatasetFailure),
        tap(({ error }) => this.gAnalyticsService.emitErrorEvent(GAActions.LOCAL_DATASET_UPLOAD, error as string))
      ),
    { dispatch: false }
  );

  errorDatasetCreateGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DatasetActions.createNADatasetFailure),
        tap(({ error }) => this.gAnalyticsService.emitErrorEvent(GAActions.CREATE, error as string))
      ),
    { dispatch: false }
  );

  constructor(
    private gAnalyticsService: GoogleAnalyticsService,
    private actions$: Actions,
    private store$: Store<RootStoreState.State>
  ) {}
}
