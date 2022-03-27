import { createAction, props } from '@ngrx/store';

import { IHFModelsData } from '@core/services/api/rest/huggingface.service';

import { ErrorState } from '@store/state';

export const loadModelData = createAction('[Huggingface model] Load model data');
export const loadModelDataSuccess = createAction(
  '[Huggingface model] Load model data success',
  props<{ data: IHFModelsData }>()
);
export const loadModelDataFailure = createAction(
  '[Huggingface model] Load model data failure',
  props<{ error: ErrorState }>()
);

export const loadModelReadme = createAction(
  '[Huggingface model] Import model readme',
  props<{ huggingfaceModelId: string }>()
);
export const loadModelReadmeSuccess = createAction(
  '[Huggingface model] Import model readme success',
  props<{ readme: string }>()
);
export const loadModelReadmeFailure = createAction(
  '[Huggingface model] Import model readme failure',
  props<{ error: ErrorState }>()
);

export const reset = createAction('[Huggingface model] reset');
