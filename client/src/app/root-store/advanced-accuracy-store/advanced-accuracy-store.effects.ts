import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, concatMap, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import { AccuracyRestService } from '@core/services/api/rest/accuracy.service';

import * as AdvancedAccuracyStoreActions from './advanced-accuracy-store.actions';

@Injectable()
export class AdvancedAccuracyStoreEffects {
  loadRawAccuracyConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdvancedAccuracyStoreActions.loadRawAccuracyConfig),
      switchMap(({ projectId }) =>
        this.accuracyRestService.loadRawConfig$(projectId).pipe(
          map((data) => AdvancedAccuracyStoreActions.loadRawAccuracyConfigSuccess({ data })),
          catchError((error) => of(AdvancedAccuracyStoreActions.loadRawAccuracyConfigFailure({ error }))),
          takeUntil(this.actions$.pipe(ofType(AdvancedAccuracyStoreActions.reset)))
        )
      )
    )
  );

  saveRawAccuracyConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdvancedAccuracyStoreActions.saveRawAccuracyConfig),
      concatMap(({ projectId, data, onSuccess }) => {
        return this.accuracyRestService.saveRawConfig$(projectId, data).pipe(
          map(() => AdvancedAccuracyStoreActions.saveRawAccuracyConfigSuccess({ onSuccess })),
          catchError((error) => of(AdvancedAccuracyStoreActions.saveRawAccuracyConfigFailure({ error })))
        );
      })
    )
  );

  saveRawAccuracyConfigSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AdvancedAccuracyStoreActions.saveRawAccuracyConfigSuccess),
        tap(({ onSuccess }) => onSuccess?.())
      ),
    { dispatch: false }
  );

  constructor(private actions$: Actions, private accuracyRestService: AccuracyRestService) {}
}
