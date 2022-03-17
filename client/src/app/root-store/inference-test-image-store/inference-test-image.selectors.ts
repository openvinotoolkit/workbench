import { createFeatureSelector, createSelector } from '@ngrx/store';

import { State } from '@store/inference-test-image-store/inference-test-image.state';

import * as fromInferenceTestImage from './inference-test-image.reducer';

const selectAccuracyState = createFeatureSelector<State>(fromInferenceTestImage.accuracyFeatureKey);

export const selectInfering = createSelector(selectAccuracyState, (state) => state.infering);

export const selectInferingPipeline = createSelector(
  selectAccuracyState,
  (state) => Object.values(state.inferencePipelines.entities)[0]
);

export const selectError = createSelector(selectAccuracyState, (state) => state.error);

export const selectLabelSets = createSelector(selectAccuracyState, (state) => Object.values(state.labelSets.entities));

export const selectTestImage = createSelector(selectAccuracyState, (state) => state.testImage);
