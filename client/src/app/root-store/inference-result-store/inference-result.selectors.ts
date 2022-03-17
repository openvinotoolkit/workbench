import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import { State as InferenceResultState } from './inference-result.state';
import { State as AppState } from '../state';
import { InferenceResultModel } from './inference-result.model';

const getCurrentprofilingJobId = (state: InferenceResultState): InferenceResultModel => state.selectedInferenceResult;

const selectIsReportGenerating = (state: InferenceResultState): boolean => state.isReportGenerating;

const selectInferenceResultState = createFeatureSelector<AppState, InferenceResultState>('inferenceResult');

export const selectSelectedInferenceResult: MemoizedSelector<object, InferenceResultModel> = createSelector(
  selectInferenceResultState,
  getCurrentprofilingJobId
);

export const selectInferenceReportGenerating: MemoizedSelector<object, boolean> = createSelector(
  selectInferenceResultState,
  selectIsReportGenerating
);
