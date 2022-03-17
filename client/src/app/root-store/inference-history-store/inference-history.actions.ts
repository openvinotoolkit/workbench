import { createAction, props } from '@ngrx/store';

import { ErrorState } from '@store/state';

import { CompoundInferenceConfig } from '@shared/models/compound-inference-config';
import { IProfilingPipeline } from '@shared/models/pipelines/profiling-pipeline';

import { IInferenceResult } from './inference-history.model';
import { ProjectStatus } from '../project-store/project.model';

export const loadInferenceHistory = createAction('[Inference History] Load Inference History', props<{ id: number }>());

export const loadInferenceHistorySuccess = createAction(
  '[Inference History] Load Inference History Success',
  props<{ items: IInferenceResult[] }>()
);

export const loadInferenceHistoryFailure = createAction(
  '[Inference History] Load Inference History Failure',
  props<{ error: ErrorState }>()
);

export const resetInferenceHistory = createAction('[Inference History] Reset Inference History');

export const filterInferenceItemsPoints = createAction(
  '[Inference History] Filter Inference Items Points',
  props<{ ids: number[] }>()
);

export const cancelInference = createAction('[Inference History] Cancel Inference', props<{ jobId: number }>());

export const cancelInferenceSuccess = createAction(
  '[Inference History] Cancel Inference Success',
  props<{ jobId: number }>()
);

export const cancelInferenceFailure = createAction(
  '[Inference History] Cancel Inference Failure',
  props<{ error: ErrorState }>()
);

export const addRunInferenceRequest = createAction(
  '[Inference History] Add Run Inference Request',
  props<{ config: CompoundInferenceConfig }>()
);

export const addRunInferenceSuccess = createAction(
  '[Inference History] Add Run Inference Success',
  props<{ projectId: number; originalModelId: number }>()
);

export const addRunInferenceFailure = createAction(
  '[Inference History] Add Run Inference Failure',
  props<{ error: ErrorState }>()
);

export const onProfilingSocketMessage = createAction(
  '[Inference History] On Profiling Socket Message',
  props<{ message: IProfilingPipeline }>()
);

export const upsertRunningProfiling = createAction(
  '[Inference History] Upsert running profiling',
  props<{ data: IProfilingPipeline[] }>()
);

export const removeRunningProfiling = createAction(
  '[Inference History] Remove running profiling',
  props<{ id: number }>()
);

export const setRunningInferenceOverlayId = createAction(
  '[Inference History] Set running inference overlay id',
  props<{ id: string }>()
);

export const updateInferenceItemStatusAndPoints = createAction(
  '[Inference History] Update Inference Item Status And Points',
  props<{ items?: IInferenceResult[]; projectId: number; status: ProjectStatus }>()
);
