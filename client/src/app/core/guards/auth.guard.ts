import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { select, Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, switchMap, withLatestFrom } from 'rxjs/operators';

import { ConnectionService } from '@core/services/api/connection.service';

import { RootStoreState, RouterStoreSelectors } from '@store/index';
import * as AuthStoreSelectors from '@store/auth-store/auth-store.selectors';
import * as AuthStoreActions from '@store/auth-store/auth-store.actions';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private connectionService: ConnectionService,
    private router: Router,
    private store$: Store<RootStoreState.State>
  ) {}

  canActivate(): Observable<boolean> {
    const isAuthenticated$ = this.store$.select(AuthStoreSelectors.selectIsAuthenticated);
    const isLoading$ = this.store$.select(AuthStoreSelectors.selectIsLoading);
    return isAuthenticated$.pipe(
      withLatestFrom(this.store$.pipe(select(RouterStoreSelectors.selectTokenQueryParam))),
      switchMap(([isAuthenticated, loginTokenQueryParam]: [boolean, string]) => {
        if (isAuthenticated) {
          return of(true);
        }
        if (!loginTokenQueryParam) {
          // Try refresh access token
          this.store$.dispatch(AuthStoreActions.refreshTokenAction());
        }
        // Take isAuthenticated value after refresh request
        return combineLatest([isAuthenticated$, isLoading$]).pipe(
          filter(([, isRefreshingToken]) => !isRefreshingToken),
          map(([isAuthenticatedAfterRefresh]) => {
            if (!isAuthenticatedAfterRefresh) {
              this.router.navigate(['login']);
            }
            return isAuthenticatedAfterRefresh;
          })
        );
      })
    );
  }
}
