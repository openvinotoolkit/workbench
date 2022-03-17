import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ROUTER_NAVIGATION, RouterNavigationAction } from '@ngrx/router-store';
import { select, Store } from '@ngrx/store';
import { catchError, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';

import { AuthService, LoginResponse } from '@core/services/common/auth.service';

import { disconnectSocketAction } from '@store/globals-store/globals.actions';
import { RootStoreState } from '@store/index';
import { RouterStoreSelectors } from '@store/router-store';
import { Route } from '@store/router-store/route.state';

import * as AuthStoreActions from './auth-store.actions';
import * as AuthStoreSelectors from './auth-store.selectors';

@Injectable()
export class AuthStoreEffects {
  login$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthStoreActions.loginAction),
      switchMap(({ token, viaUrl }) =>
        this.authService.loginWithToken$(token, viaUrl).pipe(
          map(({ accessToken }: LoginResponse) => {
            return AuthStoreActions.loginSuccessAction({ accessToken });
          }),
          catchError((error) => of(AuthStoreActions.loginFailureAction({ error })))
        )
      )
    );
  });

  loginWithTokenQueryParam$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ROUTER_NAVIGATION),
      withLatestFrom(this.store$.pipe(select(AuthStoreSelectors.selectIsAuthenticated))),
      filter(([, isAuthenticated]) => !isAuthenticated),
      map(([action]: [RouterNavigationAction<Route>, boolean]) => action.payload.routerState.queryParams.token),
      filter((token) => !!token),
      map((token) => AuthStoreActions.loginAction({ token, viaUrl: true }))
    );
  });

  loginSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AuthStoreActions.loginSuccessAction),
        withLatestFrom(this.store$.pipe(select(RouterStoreSelectors.selectUrl))),
        tap(([, url]) => {
          if (!url || url === '/login') {
            this.router.navigateByUrl('/');
            return;
          }
          const urlTree = this.router.parseUrl(url);
          delete urlTree.queryParams.token;
          this.router.navigateByUrl(urlTree.toString());
        })
      );
    },
    { dispatch: false }
  );

  refreshToken$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthStoreActions.refreshTokenAction),
      switchMap(() =>
        this.authService.refreshToken$().pipe(
          map(({ accessToken }) => {
            return AuthStoreActions.refreshTokenSuccessAction({ accessToken });
          }),
          catchError((error) => of(AuthStoreActions.refreshTokenFailureAction({ error })))
        )
      )
    );
  });

  authFailure$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        AuthStoreActions.loginFailureAction,
        AuthStoreActions.refreshTokenFailureAction,
        AuthStoreActions.logoutFailureAction
      ),
      withLatestFrom(this.store$.pipe(select(AuthStoreSelectors.selectIsAuthenticated))),
      filter(([, isAuthenticated]) => isAuthenticated),
      map(() => AuthStoreActions.resetCredentialsAction()),
      tap(() => {
        this.router.navigate(['/login']);
      })
    );
  });

  logout$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthStoreActions.logoutAction),
      switchMap(() =>
        this.authService.logOut$().pipe(
          switchMap(({ logout }) => [AuthStoreActions.logoutSuccessAction({ logout }), disconnectSocketAction()]),
          tap(() => this.router.navigate(['/login'])),
          catchError((error) => of(AuthStoreActions.logoutFailureAction({ error })))
        )
      )
    );
  });

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private authService: AuthService,
    private router: Router
  ) {}
}
