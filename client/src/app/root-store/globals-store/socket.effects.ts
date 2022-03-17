import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { tap } from 'rxjs/operators';

import { SocketService } from '@core/services/api/socket/socket.service';

import { RootStoreState } from '@store';
import * as GlobalsStoreActions from '@store/globals-store/globals.actions';

@Injectable()
export class SocketEffects {
  connectSocket$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(GlobalsStoreActions.connectSocketAction),
        tap(({ rejectUnauthorized }) => {
          this.socketService.connect(rejectUnauthorized);
          this.socketService.socketActionsList$.subscribe((actionObservableList) => {
            actionObservableList.forEach((action$) => {
              action$.subscribe((action) => this.store$.dispatch(action));
            });
          });
        })
      );
    },
    { dispatch: false }
  );

  disconnectSocket$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(GlobalsStoreActions.disconnectSocketAction),
        tap(() => this.socketService.disconnect())
      );
    },
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private socketService: SocketService
  ) {}
}
