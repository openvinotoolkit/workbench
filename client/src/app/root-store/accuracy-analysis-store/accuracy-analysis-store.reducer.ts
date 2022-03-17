import { createReducer, on } from '@ngrx/store';

import * as AccuracyAnalysisStoreActions from './accuracy-analysis-store.actions';
import { accuracyPipelineAdapter, initialState } from './accuracy-analysis-store.state';

export const accuracyAnalysisFeatureKey = 'accuracyAnalysis';

export const reducer = createReducer(
  initialState,

  on(AccuracyAnalysisStoreActions.loadAccuracyReports, AccuracyAnalysisStoreActions.createAccuracyReport, (state) => {
    return {
      ...state,
      isLoading: true,
      error: null,
    };
  }),

  on(AccuracyAnalysisStoreActions.createAccuracyReportSuccess, (state) => {
    return {
      ...state,
      isLoading: false,
      error: null,
    };
  }),

  on(AccuracyAnalysisStoreActions.loadAccuracyReportsSuccess, (state, payload) => {
    const { reports } = payload;
    return {
      ...state,
      reports,
      isLoading: false,
      error: null,
    };
  }),

  on(
    AccuracyAnalysisStoreActions.loadAccuracyReportsFailure,
    AccuracyAnalysisStoreActions.createAccuracyReportFailure,
    (state, payload) => {
      const { error } = payload;
      return {
        ...state,
        isLoading: false,
        error,
      };
    }
  ),

  on(AccuracyAnalysisStoreActions.resetAccuracyReports, (state) => {
    return {
      ...state,
      reports: [],
    };
  }),
  on(AccuracyAnalysisStoreActions.upsertAccuracyPipeline, (state, { data }) => ({
    ...state,
    runningAccuracyPipelines: accuracyPipelineAdapter.upsertMany(data, state.runningAccuracyPipelines),
  })),
  on(AccuracyAnalysisStoreActions.removeAccuracyPipeline, (state, { id }) => ({
    ...state,
    runningAccuracyPipelines: accuracyPipelineAdapter.removeOne(id, state.runningAccuracyPipelines),
  }))
);
