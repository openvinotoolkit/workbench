import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, takeUntil } from 'rxjs/operators';
import { of } from 'rxjs';

import { InferenceRestService } from '@core/services/api/rest/inference-rest.service';

import * as CompareActions from '@store/compare-store/compare.actions';
import { InferenceResultModel } from '@store/inference-result-store/inference-result.model';

@Injectable()
export class CompareEffects {
  loadInferenceList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CompareActions.loadInferenceList),
      mergeMap((a) =>
        this.inferenceRestService.getInferenceResults$(a.projectId).pipe(
          map((result) => CompareActions.loadInferenceListSuccess({ result, side: a.side })),
          catchError((error) => of(CompareActions.loadInferenceListFailure({ error, side: a.side }))),
          takeUntil(this.actions$.pipe(ofType(CompareActions.reset)))
        )
      )
    )
  );

  loadInferenceResultModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CompareActions.loadInferenceResult),
      mergeMap(({ id, jobId, side }) =>
        this.inferenceRestService.getJobInfoForInferenceResult$(jobId, id).pipe(
          map((result) =>
            CompareActions.loadInferenceResultSuccess({
              result: new InferenceResultModel(result, id),
              side,
            })
          ),
          catchError((error) => of(CompareActions.loadInferenceListFailure({ error, side }))),
          takeUntil(this.actions$.pipe(ofType(CompareActions.reset)))
        )
      )
    )
  );

  constructor(private actions$: Actions, private inferenceRestService: InferenceRestService) {}
}
