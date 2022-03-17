import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import { EnvironmentService } from '@core/services/api/rest/environment.service';

import * as EnvironmentSetupActions from '@store/globals-store/environment-setup.actions';

@Injectable()
export class EnvironmentSetupEffects {
  sendStopRequest$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(EnvironmentSetupActions.stop),
      switchMap(() =>
        this._environmentsService.stopSetup$().pipe(
          map((response) => EnvironmentSetupActions.stopSuccess()),
          catchError((error) => of(EnvironmentSetupActions.stopFailure({ error })))
        )
      )
    );
  });

  refreshOnStopSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(EnvironmentSetupActions.stopSuccess),
        tap(() => {
          this._router.navigate(['/model-manager', 'import']).then(() => window.location.reload());
        })
      );
    },
    { dispatch: false }
  );

  constructor(private _router: Router, private actions$: Actions, private _environmentsService: EnvironmentService) {}
}
