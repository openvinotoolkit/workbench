import { Action, createReducer, on } from '@ngrx/store';

import * as PipelineActions from '@store/pipelines-store/pipelines.actions';
import { pipelineItemAdapter, initialState, State } from '@store/pipelines-store/pipelines.state';

export const pipelinesStoreFeatureKey = 'pipelines';

const targetMachineStoreReducer = createReducer(
  initialState,
  on(PipelineActions.loadPipelineForTargetMachine, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(PipelineActions.loadPipelineForTargetMachineSuccess, (state, { pipelines }) =>
    pipelineItemAdapter.setAll(pipelines, {
      ...state,
      isLoading: false,
    })
  ),
  on(PipelineActions.loadPipelineForTargetMachineFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),
  on(PipelineActions.updatePipelines, (state, { pipelines }) =>
    pipelineItemAdapter.upsertMany(pipelines, {
      ...state,
      isLoading: false,
    })
  )
);

export function reducer(state: State | undefined, action: Action) {
  return targetMachineStoreReducer(state, action);
}
