import { Action } from '@ngrx/store';

import { reducer } from './inference-result.reducer';
import { initialState } from './inference-result.state';
import { InferenceResultStoreActions, InferenceResultStoreReducer } from './';
import { InferenceResultModel } from './inference-result.model';

const jobId = 1;
const inferenceResultId = 1;

const mockInferenceResult = {
  jobId,
  inferenceResultId,
  execInfo: {},
  config: {},
} as InferenceResultModel;

const loadAction = InferenceResultStoreActions.loadInferenceResult({
  jobId,
  inferenceResultId,
});

describe('InferenceResult Reducer', () => {
  describe('an unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = reducer(initialState, action);

      expect(result).toBe(initialState);
    });
  });

  describe('LOAD_INFERENCE_RESULT action', () => {
    it('should set loading to true', () => {
      const state = InferenceResultStoreReducer(initialState, loadAction);

      expect(state.isLoading).toEqual(true);
      expect(state.selectedInferenceResult).toBeNull();
      expect(state.inferenceResultForComparison).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('LOAD_INFERENCE_RESULT_FAILURE action', () => {
    it('should set error', () => {
      const error = { message: 'Error' };
      const action = InferenceResultStoreActions.loadInferenceResultFailure({ error });

      const previousState = InferenceResultStoreReducer(initialState, loadAction);
      const state = InferenceResultStoreReducer(previousState, action);

      expect(state.error).toEqual(error);
      expect(state.isLoading).toEqual(false);
      expect(state.selectedInferenceResult).toEqual(previousState.selectedInferenceResult);
      expect(state.inferenceResultForComparison).toEqual(previousState.inferenceResultForComparison);
    });
  });

  describe('LOAD_INFERENCE_RESULT_SUCCESS action', () => {
    it('should set selected inference result', () => {
      const action = InferenceResultStoreActions.loadInferenceResultSuccess({
        result: mockInferenceResult,
      });

      const previousState = InferenceResultStoreReducer(initialState, loadAction);
      const state = InferenceResultStoreReducer(previousState, action);

      expect(state.selectedInferenceResult).toEqual(mockInferenceResult);
      expect(state.inferenceResultForComparison).toEqual(previousState.inferenceResultForComparison);

      expect(state.error).toBeNull();
      expect(state.isLoading).toEqual(false);
    });
  });

  describe('RESET_SELECTED_INFERENCE_RESULT action', () => {
    it('should reset selected inference result', () => {
      const action = InferenceResultStoreActions.loadInferenceResultSuccess({
        result: mockInferenceResult,
      });

      const resetAction = InferenceResultStoreActions.resetSelectedInferenceResult();

      const previousState = InferenceResultStoreReducer(initialState, action);
      const state = InferenceResultStoreReducer(previousState, resetAction);

      expect(state.error).toBeNull();
      expect(state.isLoading).toEqual(false);
      expect(state.selectedInferenceResult).toBeNull();
      expect(state.inferenceResultForComparison).toEqual(previousState.inferenceResultForComparison);
    });
  });
});
