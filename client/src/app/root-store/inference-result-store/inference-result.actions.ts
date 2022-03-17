import { createAction, props } from '@ngrx/store';

import { ErrorState } from '@store/state';

import { InferenceResultModel } from './inference-result.model';

export const setSelectedInferenceResult = createAction(
  '[Inference Result] Set Selected Inference Result',
  props<{ jobId: number; inferenceResultId: number }>()
);

export const loadInferenceResult = createAction(
  '[Inference Result] Load Inference Result',
  props<{ jobId: number; inferenceResultId: number }>()
);

export const loadInferenceResultSuccess = createAction(
  '[Inference Result] Load Inference Result Success',
  props<{ result: InferenceResultModel }>()
);

export const loadInferenceResultFailure = createAction(
  '[Inference Result] Load Inference Result Failure',
  props<{ error: ErrorState }>()
);

export const resetSelectedInferenceResult = createAction('[Inference Result] Reset Selected Inference Result');
