import { createAction, props } from '@ngrx/store';

import { IInferenceResult } from '@store/inference-history-store/inference-history.model';
import { InferenceResultModel } from '@store/inference-result-store/inference-result.model';
import { CompareSide } from '@store/compare-store/compare.state';
import { ErrorState } from '@store/state';

export const loadInferenceList = createAction(
  '[Compare] Load inference list',
  props<{ projectId: number; side: CompareSide }>()
);
export const loadInferenceListSuccess = createAction(
  '[Compare] Load inference list success',
  props<{ result: IInferenceResult[]; side: CompareSide }>()
);
export const loadInferenceListFailure = createAction(
  '[Compare] Load inference list failure',
  props<{ error: ErrorState; side: CompareSide }>()
);

export const loadInferenceResult = createAction(
  '[Compare] Load inference result',
  props<{ jobId: number; id: number; side: CompareSide }>()
);
export const loadInferenceResultSuccess = createAction(
  '[Compare] Load inference result success',
  props<{ result: InferenceResultModel; side: CompareSide }>()
);
export const loadInferenceResultFailure = createAction(
  '[Compare] Load inference result failure',
  props<{ error: ErrorState; side: CompareSide }>()
);

export const reset = createAction('[Compare] Reset');
