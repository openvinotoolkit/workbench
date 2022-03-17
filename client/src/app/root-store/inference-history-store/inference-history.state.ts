import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';

import { ErrorState } from '@store/state';

import { IProfilingPipeline } from '@shared/models/pipelines/profiling-pipeline';

import { ICompoundInference, IInferenceResult } from './inference-history.model';

export const inferenceResultAdapter: EntityAdapter<IInferenceResult> = createEntityAdapter<IInferenceResult>({
  selectId: (item) => item.id,
  sortComparer: (a: IInferenceResult, b: IInferenceResult): number =>
    new Date(a.created).valueOf() - new Date(b.created).valueOf(),
});

export const compoundInferenceAdapter: EntityAdapter<ICompoundInference> = createEntityAdapter<ICompoundInference>({
  selectId: (item) => item.jobId,
  sortComparer: (a: ICompoundInference, b: ICompoundInference): number =>
    new Date(a.created).valueOf() - new Date(b.created).valueOf(),
});

export const remoteInferencePipelineAdapter = createEntityAdapter<IProfilingPipeline>({
  selectId: (item) => item.id,
  sortComparer: (a, b): number => b.id - a.id,
});

export interface State extends EntityState<IInferenceResult> {
  selectedId: number;
  hiddenIds: number[];
  runningProfilingPipelines: EntityState<IProfilingPipeline>;
  runningInferenceOverlayId: string;
  isLoading?: boolean;
  error?: ErrorState;
}

export const initialState: State = inferenceResultAdapter.getInitialState({
  selectedId: null,
  hiddenIds: [],
  runningProfilingPipelines: remoteInferencePipelineAdapter.getInitialState(),
  runningInferenceOverlayId: null,
  isLoading: false,
  error: null,
});
