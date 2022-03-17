import { createFeatureSelector, createSelector } from '@ngrx/store';

import { State } from './accuracy-analysis-store.state';
import * as fromAccuracyAnalysisReducer from './accuracy-analysis-store.reducer';

const selectAccuracyAnalysisState = createFeatureSelector<State>(
  fromAccuracyAnalysisReducer.accuracyAnalysisFeatureKey
);

export const selectLoading = createSelector(selectAccuracyAnalysisState, (state) => state.isLoading);

export const selectError = createSelector(selectAccuracyAnalysisState, (state) => state.error);

export const selectAccuracyReports = createSelector(selectAccuracyAnalysisState, (state) => state.reports);

export const selectRunningAccuracyPipeline = (projectId: number) =>
  createSelector(selectAccuracyAnalysisState, (state) =>
    Object.values(state.runningAccuracyPipelines.entities).find((pipeline) => pipeline.projectId === projectId)
  );
