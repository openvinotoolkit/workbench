import { Router } from '@angular/router';
import { Injectable } from '@angular/core';

import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { TuningRestService } from '@core/services/api/rest/tuning-rest.service';

import * as RootStoreState from '../state';
import * as ModelTuningActions from './model-tuning.actions';

@Injectable()
export class ModelTuningEffects {
  modelInt8CalibrationStart$ = createEffect(() =>
    this._actions$.pipe(
      ofType(ModelTuningActions.modelInt8CalibrationStart),
      mergeMap((action) => {
        return this._tuningRestService.runInt8Tuning$(action.tuningConfig).pipe(
          map((res) => {
            if (!res || !res.jobId) {
              const error = 'Invalid response on run model tuning';
              return ModelTuningActions.modelCalibrationStartFailure({ error });
            }

            return ModelTuningActions.modelCalibrationStartSuccess({
              originalModelId: action.originalModelId,
              projectId: res.projectId,
            });
          }),
          catchError((error) => {
            return of(ModelTuningActions.modelCalibrationStartFailure({ error }));
          })
        );
      })
    )
  );

  modelCalibrationStartSuccess$ = createEffect(
    () =>
      this._actions$.pipe(
        ofType(ModelTuningActions.modelCalibrationStartSuccess),
        tap(({ originalModelId, projectId }) => {
          this._router.navigate(['dashboard', originalModelId, 'projects', projectId]);
        })
      ),
    { dispatch: false }
  );

  constructor(
    private readonly _actions$: Actions,
    private readonly _store$: Store<RootStoreState.State>,
    private readonly _tuningRestService: TuningRestService,
    private readonly _router: Router
  ) {}
}
