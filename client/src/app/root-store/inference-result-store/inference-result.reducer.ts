import { createReducer, on } from '@ngrx/store';

import * as ExportInferenceResultActions from './export-inference-report.actions';
import * as InferenceResultActions from './inference-result.actions';
import { initialState } from './inference-result.state';

export const reducer = createReducer(
  initialState,

  on(InferenceResultActions.loadInferenceResult, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  on(InferenceResultActions.loadInferenceResultSuccess, (state, { result }) => ({
    ...state,
    selectedInferenceResult: result,
    isLoading: false,
    error: null,
  })),

  on(InferenceResultActions.loadInferenceResultFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(InferenceResultActions.resetSelectedInferenceResult, (state) => ({
    ...state,
    selectedInferenceResult: null,
    isLoading: false,
    error: null,
  })),

  on(ExportInferenceResultActions.startExportInferenceResultReport, (state) => ({
    ...state,
    isReportGenerating: true,
  })),

  on(ExportInferenceResultActions.exportInferenceResultReportSuccess, (state) => ({
    ...state,
    isReportGenerating: false,
  }))
);
