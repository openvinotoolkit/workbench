import { createFeatureSelector, createSelector } from '@ngrx/store';

import { FEATURE_KEY } from './advanced-accuracy-store.module';
import { State } from './advanced-accuracy-store.state';

export const selectAdvancedAccuracyState = createFeatureSelector<State>(FEATURE_KEY);

export const selectRawAccuracySavePending = createSelector(selectAdvancedAccuracyState, (state) => state.savePending);
