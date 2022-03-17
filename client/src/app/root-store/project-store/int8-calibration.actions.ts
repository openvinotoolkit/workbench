import { createAction, props } from '@ngrx/store';

import { IInt8CalibrationPipeline } from '@shared/models/pipelines/int8-calibration-pipeline';

export const onInt8CalibrationPipelineSocketMessage = createAction(
  '[INT8 CALIBRATION] On int8 socket message',
  props<{ message: IInt8CalibrationPipeline }>()
);

export const upsertInt8CalibrationPipeline = createAction(
  '[INT8 CALIBRATION] Upsert int 8 calibration pipeline',
  props<{ data: IInt8CalibrationPipeline[] }>()
);

export const removeInt8CalibrationPipeline = createAction(
  '[INT8 CALIBRATION] Remove int 8 calibration pipeline',
  props<{ data: number[] }>()
);
