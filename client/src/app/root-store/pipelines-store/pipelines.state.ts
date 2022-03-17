import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';

import { ErrorState } from '@store/state';

import { IConfigureTargetPipeline } from '@shared/models/pipelines/target-machines/configure-target-pipeline';

export const pipelineItemAdapter: EntityAdapter<IConfigureTargetPipeline> = createEntityAdapter<
  IConfigureTargetPipeline
>({
  selectId: (pipeline) => pipeline.id,
  sortComparer: (a: IConfigureTargetPipeline, b: IConfigureTargetPipeline): number =>
    a.id.toString().localeCompare(b.id.toString()),
});

export interface State extends EntityState<IConfigureTargetPipeline> {
  isLoading: boolean;
  error?: ErrorState;
}

export const initialState: State = pipelineItemAdapter.getInitialState({
  isLoading: false,
  error: null,
});
