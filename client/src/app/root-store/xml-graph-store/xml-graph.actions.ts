import { createAction, props } from '@ngrx/store';

import { ErrorState } from '@store/state';

const xmlGraphActionPrefix = 'XML Graph';

export const setOriginalGraphIdAction = createAction(
  `[${xmlGraphActionPrefix}] Set Model Original Graph Id`,
  props<{ modelId: number }>()
);

export const loadOriginalGraphAction = createAction(`[${xmlGraphActionPrefix}] Load Model Original Graph`);

export const loadOriginalGraphSuccessAction = createAction(
  `${loadOriginalGraphAction.type} Success`,
  props<{ xmlContent: string }>()
);

export const loadOriginalGraphFailureAction = createAction(
  `${loadOriginalGraphAction.type} Failure`,
  props<{ error: ErrorState }>()
);

export const setRuntimeGraphIdAction = createAction(
  `[${xmlGraphActionPrefix}] Set Model Runtime Graph Id`,
  props<{ inferenceResultId: number }>()
);

export const loadRuntimeGraphAction = createAction(`[${xmlGraphActionPrefix}] Load Model Runtime Graph`);

export const loadRuntimeGraphSuccessAction = createAction(
  `${loadRuntimeGraphAction.type} Success`,
  props<{ xmlContent: string }>()
);

export const loadRuntimeGraphFailureAction = createAction(
  `${loadRuntimeGraphAction.type} Failure`,
  props<{ error: ErrorState }>()
);

export const resetGraphsAction = createAction(`[${xmlGraphActionPrefix}] Reset Model Graphs`);
