import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import { CommonRestService } from '@core/services/api/rest/common-rest.service';

import * as EraseAllActions from '@store/globals-store/erase-all.actions';

@Injectable()
export class EraseAllEffects {
  sendEraseAllRequest$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(EraseAllActions.eraseAll),
      switchMap(() =>
        this.commonRestService.eraseAll$().pipe(
          map((response) => EraseAllActions.eraseAllSuccess()),
          catchError((error) => of(EraseAllActions.eraseAllFailure({ error })))
        )
      )
    );
  });

  redirectOnEraseAllSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(EraseAllActions.eraseAllSuccess),
        tap(() => {
          this.router.navigate(['/']).then(() => window.location.reload());
        })
      );
    },
    { dispatch: false }
  );

  constructor(private router: Router, private actions$: Actions, private commonRestService: CommonRestService) {}
}
