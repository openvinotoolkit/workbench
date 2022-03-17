import { createAction, props } from '@ngrx/store';

import { IConfigureTargetPipeline } from '@shared/models/pipelines/target-machines/configure-target-pipeline';

export const loadPipelineForTargetMachine = createAction(
  '[Pipelines] Load Pipeline For Target Machines',
  props<{ targetMachineId: number }>()
);

export const loadPipelineForTargetMachineSuccess = createAction(
  '[Pipelines] Load Pipeline For Target Machines Success',
  props<{ pipelines: IConfigureTargetPipeline[] }>()
);

export const loadPipelineForTargetMachineFailure = createAction(
  '[Pipelines] Load Pipeline For Target Machines Failure',
  props<{ error }>()
);

export const onSetupTargetPipelineSocketMessage = createAction(
  '[Pipelines] On Setup Target Pipeline Socket Message',
  props<{ message: IConfigureTargetPipeline[] }>()
);

export const onPingTargetPipelineSocketMessage = createAction(
  '[Pipelines] On Ping Target Pipeline Socket Message',
  props<{ message: IConfigureTargetPipeline[] }>()
);

export const updatePipelines = createAction(
  '[Pipelines] Update Pipelines',
  props<{ pipelines: IConfigureTargetPipeline[] }>()
);
