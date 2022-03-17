import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { filter, map } from 'rxjs/operators';
import { ROUTER_NAVIGATED, RouterNavigationAction } from '@ngrx/router-store';
import { Store } from '@ngrx/store';

import { RootStoreState } from '@store/index';
import { TargetMachineActions } from '@store/target-machine-store';

import { Route } from './route.state';

@Injectable()
export class RouterEffects {
  createProjectNavigated$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ROUTER_NAVIGATED),
      filter((routeChangeAction: RouterNavigationAction<Route>) =>
        routeChangeAction.payload.routerState.url.startsWith('/projects/create')
      ),
      map(() => TargetMachineActions.loadTargetMachines())
    )
  );

  constructor(private actions$: Actions, private store$: Store<RootStoreState.State>) {}
}
