import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import { AuthErrorDTO } from '@shared/models/jwt';

import * as fromAuthStore from './auth-store.reducer';

export const selectAuthStoreState = createFeatureSelector<fromAuthStore.State>(fromAuthStore.authStoreFeatureKey);

export const selectIsAuthenticated: MemoizedSelector<object, boolean> = createSelector(
  selectAuthStoreState,
  (authStoreState) => !!authStoreState.accessToken
);

export const selectIsLoading: MemoizedSelector<object, boolean> = createSelector(
  selectAuthStoreState,
  (authStoreState) => authStoreState.isLoading
);

export const selectError: MemoizedSelector<object, AuthErrorDTO> = createSelector(
  selectAuthStoreState,
  (authStoreState) => authStoreState.error
);

export const selectIsRefreshingToken: MemoizedSelector<object, boolean> = createSelector(
  selectAuthStoreState,
  (authStoreState) => authStoreState.isRefreshingToken
);

export const selectAccessToken: MemoizedSelector<object, string> = createSelector(
  selectAuthStoreState,
  (authStoreState) => authStoreState.accessToken
);
