import { createReducer, on } from '@ngrx/store';

import * as HuggingfaceModelsActions from './huggingface-model-store.actions';
import { initialState } from './huggingface-model-store.state';

export const reducer = createReducer(
  initialState,

  on(HuggingfaceModelsActions.loadModelData, (state) => ({
    ...state,
    isModelsDataLoading: true,
    modelsDataError: null,
  })),

  on(HuggingfaceModelsActions.loadModelDataSuccess, (state, { data }) => ({
    ...state,
    modelsData: data,
    isModelsDataLoading: false,
    modelsDataError: null,
  })),

  on(HuggingfaceModelsActions.loadModelDataFailure, (state, { error }) => ({
    ...state,
    modelsDataError: error,
    isModelsDataLoading: false,
  })),

  on(HuggingfaceModelsActions.loadModelReadme, (state) => ({
    ...state,
    modelReadme: null,
    isLoadingReadme: true,
    modelReadmeError: null,
  })),

  on(HuggingfaceModelsActions.loadModelReadmeSuccess, (state, { readme }) => ({
    ...state,
    modelReadme: readme,
    isLoadingReadme: false,
  })),

  on(HuggingfaceModelsActions.loadModelReadmeFailure, (state, { error }) => ({
    ...state,
    modelReadme: null,
    modelReadmeError: error,
    isLoadingReadme: false,
  })),

  on(HuggingfaceModelsActions.reset, () => initialState)
);
