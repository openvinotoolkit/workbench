import { Action, createReducer, on } from '@ngrx/store';

import { AuthErrorDTO } from '@shared/models/jwt';

import * as AuthStoreActions from './auth-store.actions';

export const authStoreFeatureKey = 'auth';

export interface State {
  accessToken: string;
  isRefreshingToken?: boolean;
  isLoading?: boolean;
  error?: AuthErrorDTO;
}

export const initialState: State = {
  accessToken: null,
  isRefreshingToken: false,
  isLoading: false,
  error: null,
};

const authStoreReducer = createReducer(
  initialState,

  on(AuthStoreActions.loginAction, AuthStoreActions.logoutAction, (state) => ({
    ...state,
    isLoading: true,
    isRefreshingToken: false,
    error: null,
  })),
  on(AuthStoreActions.refreshTokenAction, (state) => ({
    ...state,
    accessToken: null,
    isRefreshingToken: true,
    isLoading: true,
    error: null,
  })),
  on(AuthStoreActions.loginSuccessAction, AuthStoreActions.refreshTokenSuccessAction, (state, { accessToken }) => ({
    ...state,
    accessToken,
    isRefreshingToken: false,
    isLoading: false,
    error: null,
  })),
  on(
    AuthStoreActions.loginFailureAction,
    AuthStoreActions.logoutFailureAction,
    AuthStoreActions.refreshTokenFailureAction,
    (state, { error }) => ({
      ...state,
      error,
      isLoading: false,
      isRefreshingToken: false,
    })
  ),
  on(AuthStoreActions.logoutSuccessAction, () => ({ ...initialState })),
  on(AuthStoreActions.resetCredentialsAction, (state, action) => ({
    ...state,
    accessToken: null,
    jti: null,
  }))
);

export function reducer(state: State | undefined, action: Action) {
  return authStoreReducer(state, action);
}
