import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { filter, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';

import { Categories, GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import * as ModelStoreSelectors from '@store/model-store/model.selectors';
import * as DatasetStoreSelectors from '@store/dataset-store/dataset.selectors';
import * as TargetStoreSelectors from '@store/target-machine-store/target-machine.selectors';
import * as ProjectStoreSelectors from '@store/project-store/project.selectors';
import { InferenceHistoryStoreSelectors, RootStoreState } from '@store';
import { ProjectStatusNames } from '@store/project-store/project.model';
import { IInferenceResult } from '@store/inference-history-store/inference-history.model';

import * as InferenceHistoryActions from './inference-history.actions';

@Injectable()
export class InferenceHistoryGAEffects {
  addRunInferenceSuccessGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(InferenceHistoryActions.addRunInferenceRequest),
        switchMap((payload) =>
          of(payload).pipe(
            withLatestFrom(
              this.store$.select(ModelStoreSelectors.selectModelById, payload.config.modelId),
              this.store$.select(DatasetStoreSelectors.selectDatasetById, payload.config.datasetId),
              this.store$.select(TargetStoreSelectors.selectTargetMachineById, payload.config.targetId)
            )
          )
        ),
        filter(([, model, dataset, machine]) => !!model && !!dataset && !!machine),
        tap(([payload, model, dataset, machine]) => {
          this.gAnalyticsService.emitRunInferEvent(payload.config, model, dataset, machine);
        })
      ),
    { dispatch: false }
  );

  cancelInferenceGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(InferenceHistoryActions.cancelInference),
        tap(() => {
          this.gAnalyticsService.emitCancelEvent(Categories.INFERENCE);
        })
      ),
    { dispatch: false }
  );

  preprocessInferenceResultGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(InferenceHistoryActions.updateInferenceItemStatusAndPoints),
        switchMap((payload) =>
          of(payload).pipe(
            withLatestFrom(
              this.store$.select(InferenceHistoryStoreSelectors.selectBaselineInferencePoint),
              this.store$.select(ProjectStoreSelectors.selectProjectById, payload.projectId)
            )
          )
        ),
        // in case if there is a few sockets with ready status are coming, catch the one that actually changes status
        filter(
          ([{ status, items }, baselinePoint, project]) =>
            items && status.name === ProjectStatusNames.READY && project.status.name === ProjectStatusNames.RUNNING
        ),
        tap(([{ items }, baselinePoint]) => {
          items.forEach((item: IInferenceResult) =>
            this.gAnalyticsService.emitInferenceReportEvent(item, baselinePoint)
          );
        })
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private gAnalyticsService: GoogleAnalyticsService
  ) {}
}
