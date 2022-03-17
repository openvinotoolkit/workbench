import { createReducer, on } from '@ngrx/store';

import { initialState } from './advanced-accuracy-store.state';
import * as AdvancedAccuracyStoreActions from './advanced-accuracy-store.actions';

export const reducer = createReducer(
  initialState,

  on(AdvancedAccuracyStoreActions.loadRawAccuracyConfig, (state) => ({
    ...state,
    config: null,
    loading: true,
    error: null,
  })),
  on(AdvancedAccuracyStoreActions.loadRawAccuracyConfigSuccess, (state, { data }) => ({
    ...state,
    config: data,
    loading: false,
    error: null,
  })),
  on(AdvancedAccuracyStoreActions.loadRawAccuracyConfigFailure, (state, { error }) => ({
    ...state,
    config: null,
    loading: false,
    error,
  })),
  on(AdvancedAccuracyStoreActions.saveRawAccuracyConfig, (state) => ({
    ...state,
    loading: true,
    savePending: true,
    error: null,
  })),
  on(AdvancedAccuracyStoreActions.saveRawAccuracyConfigSuccess, (state) => ({
    ...state,
    loading: false,
    savePending: false,
    error: null,
  })),
  on(AdvancedAccuracyStoreActions.saveRawAccuracyConfigFailure, (state, { error }) => ({
    ...state,
    loading: false,
    savePending: false,
    error,
  })),

  on(AdvancedAccuracyStoreActions.reset, () => ({ ...initialState }))
);
