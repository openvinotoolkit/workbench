import { createAction, props } from '@ngrx/store';

import { IRawAccuracyConfig } from '@store/advanced-accuracy-store/advanced-accuracy-store.models';
import { ErrorState } from '@store/state';

export const loadRawAccuracyConfig = createAction(
  '[Advanced accuracy] Load raw accuracy config',
  props<{ projectId: number }>()
);
export const loadRawAccuracyConfigSuccess = createAction(
  '[Advanced accuracy] Load raw accuracy config success',
  props<{ data: IRawAccuracyConfig }>()
);
export const loadRawAccuracyConfigFailure = createAction(
  '[Advanced accuracy] Load raw accuracy config failure',
  props<{ error: ErrorState }>()
);

export const saveRawAccuracyConfig = createAction(
  '[Advanced accuracy] Save raw accuracy config',
  props<{
    projectId: number;
    data: IRawAccuracyConfig;
    onSuccess?: () => void;
  }>()
);

export const saveRawAccuracyConfigSuccess = createAction(
  '[Advanced accuracy] Save raw accuracy config success',
  props<{ onSuccess?: () => void }>()
);

export const saveRawAccuracyConfigFailure = createAction(
  '[Advanced accuracy] Save raw accuracy config failure',
  props<{ error: ErrorState }>()
);

export const reset = createAction('[Advanced accuracy] Reset');
