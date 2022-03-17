import { createReducer, on } from '@ngrx/store';

import {
  inferencePipelineAdapter,
  initialState,
  labelSetAdapter,
} from '@store/inference-test-image-store/inference-test-image.state';

import * as InferenceTestImageStoreActions from './inference-test-image.actions';

export const accuracyFeatureKey = 'inferenceTestImage';

export const reducer = createReducer(
  initialState,

  // inference
  on(InferenceTestImageStoreActions.testImage, (state) => ({
    ...state,
    testImage: null,
    infering: true,
    error: null,
  })),
  on(InferenceTestImageStoreActions.testImageSuccess, (state, { data }) => ({
    ...state,
    error: null,
    inferencePipelines: inferencePipelineAdapter.upsertOne(data, state.inferencePipelines),
  })),
  on(InferenceTestImageStoreActions.testImageFailure, (state, { error }) => ({
    ...state,
    testImage: null,
    infering: false,
    error,
  })),

  // pipelines
  on(InferenceTestImageStoreActions.upsertInferencePipelines, (state, { data }) => ({
    ...state,
    inferencePipelines: inferencePipelineAdapter.upsertMany(data, state.inferencePipelines),
  })),
  on(InferenceTestImageStoreActions.removeInferencePipeline, (state, { id }) => {
    const inferencePipelines = inferencePipelineAdapter.removeOne(id, state.inferencePipelines);
    return {
      ...state,
      infering: !!inferencePipelines.ids.length,
      inferencePipelines,
    };
  }),

  // test image
  on(InferenceTestImageStoreActions.setTestImage, (state, { data }) => ({
    ...state,
    testImage: data,
  })),

  // label sets

  on(InferenceTestImageStoreActions.loadLabelSetsSuccess, (state, { data }) => ({
    ...state,
    labelSets: labelSetAdapter.upsertMany(data, state.labelSets),
  })),

  // reset state
  on(InferenceTestImageStoreActions.resetAccuracyState, () => initialState),
  on(InferenceTestImageStoreActions.resetTestImage, (state) => ({
    ...state,
    testImage: null,
    error: null,
    inferencePipelines: inferencePipelineAdapter.getInitialState(),
    infering: false,
  }))
);
