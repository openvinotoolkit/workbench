import { createFeatureSelector, createSelector } from '@ngrx/store';

import { FEATURE_KEY } from '@store/huggingface-model-store/huggingface-model-store.module';

import { State } from './huggingface-model-store.state';

const selectHFModelState = createFeatureSelector<State>(FEATURE_KEY);

export const selectLoading = createSelector(selectHFModelState, (state) => state.isModelsDataLoading);
export const selectError = createSelector(selectHFModelState, (state) => state.modelsDataError);
export const selectModelsData = createSelector(selectHFModelState, (state) => state.modelsData);

export const selectModelReadme = createSelector(selectHFModelState, (state) => state.modelReadme);
export const selectModelReadmeLoading = createSelector(selectHFModelState, (state) => state.isLoadingReadme);
export const selectModelReadmeError = createSelector(selectHFModelState, (state) => state.modelReadmeError);
