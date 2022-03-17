import { createEntityAdapter, EntityState } from '@ngrx/entity';

import { ILabelSet, ITestImage } from '@store/inference-test-image-store/inference-test-image-models';

import { IInferenceTestImagePipeline } from '@shared/models/pipelines/inference-test-image-pipeline';

export const inferencePipelineAdapter = createEntityAdapter<IInferenceTestImagePipeline>({
  selectId: (i) => i.id,
  sortComparer: (a, b): number => a.id - b.id,
});

export const labelSetAdapter = createEntityAdapter<ILabelSet>({
  selectId: (i) => i.id,
  sortComparer: (a, b): number => a.id - b.id,
});

export interface State {
  infering: boolean;
  inferencePipelines: EntityState<IInferenceTestImagePipeline>;
  testImage: ITestImage;
  labelSets: EntityState<ILabelSet>;
  error: string;
}

export const initialState: State = {
  infering: false,
  inferencePipelines: inferencePipelineAdapter.getInitialState(),
  testImage: null,
  labelSets: labelSetAdapter.getInitialState(),
  error: null,
};
