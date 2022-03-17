import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';

import { InferenceRestService } from '@core/services/api/rest/inference-rest.service';
import { GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import { XMLGraphStoreActions } from '@store/xml-graph-store';
import * as ProjectStoreSelectors from '@store/project-store/project.selectors';
import { ProjectItem } from '@store/project-store/project.model';

import * as InferenceResultActions from './inference-result.actions';
import { selectSelectedInferenceResult } from './inference-result.selectors';
import { CompoundJobForInferenceDTO, InferenceResultModel } from './inference-result.model';
import { RootStoreState } from '../index';

@Injectable()
export class InferenceResultEffects {
  setInferenceResult$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InferenceResultActions.setSelectedInferenceResult),
      withLatestFrom(this.store$.pipe(select(selectSelectedInferenceResult))),
      // Prevent loading inference result and runtime graph for already selected item
      filter(
        ([{ inferenceResultId }, selectedInferenceResult]) =>
          !selectedInferenceResult || selectedInferenceResult.inferenceResultId !== inferenceResultId
      ),
      switchMap(([{ jobId, inferenceResultId }]) => [
        InferenceResultActions.loadInferenceResult({ jobId, inferenceResultId }),
        XMLGraphStoreActions.setRuntimeGraphIdAction({ inferenceResultId }),
      ])
    )
  );

  loadInferenceResult$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InferenceResultActions.loadInferenceResult),
      switchMap(({ jobId, inferenceResultId }) => {
        return this.inferenceRestService.getJobInfoForInferenceResult$(jobId, inferenceResultId).pipe(
          map((data: CompoundJobForInferenceDTO) => {
            const result = new InferenceResultModel(data, inferenceResultId);
            return InferenceResultActions.loadInferenceResultSuccess({ result });
          }),
          catchError((error) => of(InferenceResultActions.loadInferenceResultFailure({ error })))
        );
      })
    )
  );

  reportPrecisionAnalysisGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(InferenceResultActions.loadInferenceResultSuccess),
        filter(({ result }) => !!result),
        withLatestFrom(this.store$.select<ProjectItem>(ProjectStoreSelectors.selectSelectedProject)),
        tap(([{ result }, project]) => {
          const {
            layerTimeDistribution,
            runtimeRepresentation,
            precisionTransitions,
            runtimePrecisionsAvailable,
          } = result;
          if (!runtimePrecisionsAvailable) {
            return;
          }
          this.googleAnalyticsService.emitPrecisionAnalysis(
            layerTimeDistribution,
            runtimeRepresentation,
            precisionTransitions,
            project
          );
        })
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private inferenceRestService: InferenceRestService,
    private googleAnalyticsService: GoogleAnalyticsService
  ) {}
}
