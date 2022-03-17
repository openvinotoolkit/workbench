import { createFeatureSelector, createSelector } from '@ngrx/store';

import { State as AppState } from '@store/state';

import { FEATURE_KEY } from './advanced-accuracy-store.module';
import { State } from './advanced-accuracy-store.state';

export const selectAdvancedAccuracyState = createFeatureSelector<AppState, State>(FEATURE_KEY);

export const selectRawAccuracySavePending = createSelector(selectAdvancedAccuracyState, (state) => state.savePending);
