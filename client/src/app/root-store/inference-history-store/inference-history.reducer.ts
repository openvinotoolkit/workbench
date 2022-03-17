import { createReducer, on } from '@ngrx/store';

import * as InferenceHistoryActions from './inference-history.actions';
import { inferenceResultAdapter, initialState, remoteInferencePipelineAdapter } from './inference-history.state';

export const reducer = createReducer(
  initialState,

  on(
    InferenceHistoryActions.addRunInferenceRequest,
    InferenceHistoryActions.loadInferenceHistory,
    InferenceHistoryActions.cancelInference,
    (state) => ({ ...state, isLoading: true, error: null })
  ),

  on(InferenceHistoryActions.loadInferenceHistorySuccess, (state, { items }) =>
    inferenceResultAdapter.setAll(items, {
      ...state,
      isLoading: false,
      error: null,
    })
  ),

  on(InferenceHistoryActions.resetInferenceHistory, (state) => ({
    ...initialState,
    runningInferenceOverlayId: state.runningInferenceOverlayId,
  })),

  on(InferenceHistoryActions.addRunInferenceSuccess, (state) => ({
    ...state,
    isLoading: false,
    error: null,
  })),

  on(
    InferenceHistoryActions.addRunInferenceFailure,
    InferenceHistoryActions.loadInferenceHistoryFailure,
    InferenceHistoryActions.cancelInferenceFailure,
    (state, { error }) => ({
      ...state,
      isLoading: false,
      error,
    })
  ),

  on(InferenceHistoryActions.filterInferenceItemsPoints, (state, { ids }) => ({
    ...state,
    hiddenIds: ids,
  })),

  on(InferenceHistoryActions.upsertRunningProfiling, (state, { data }) => ({
    ...state,
    runningProfilingPipelines: remoteInferencePipelineAdapter.upsertMany(data, state.runningProfilingPipelines),
  })),

  on(InferenceHistoryActions.removeRunningProfiling, (state, { id }) => ({
    ...state,
    runningProfilingPipelines: remoteInferencePipelineAdapter.removeOne(id, state.runningProfilingPipelines),
  })),

  on(InferenceHistoryActions.setRunningInferenceOverlayId, (state, { id }) => ({
    ...state,
    runningInferenceOverlayId: id,
  })),

  on(InferenceHistoryActions.updateInferenceItemStatusAndPoints, (state, { items }) =>
    inferenceResultAdapter.upsertMany(items || [], { ...state })
  )
);
