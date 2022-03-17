import { createAction, props } from '@ngrx/store';

import { ErrorState } from '@store/state';

import { Int8CalibrationConfig } from '@shared/models/int8-calibration-config';

// Consider moving to int8-calibration file
export const modelInt8CalibrationStart = createAction(
  '[Model Tuning] Model Int8 Calibration Start',
  props<{ tuningConfig: Int8CalibrationConfig; originalModelId: number }>()
);

export const modelCalibrationStartSuccess = createAction(
  '[Model Tuning] Model Tuning Calibration Success',
  props<{ originalModelId: number; projectId: number }>()
);

export const modelCalibrationStartFailure = createAction(
  '[Model Tuning] Model Tuning Calibration Failure',
  props<{ error: ErrorState }>()
);
