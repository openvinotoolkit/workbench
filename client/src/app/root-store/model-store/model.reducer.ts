import { createReducer, on } from '@ngrx/store';

import { initialState, modelDownloaderItemAdapter, modelItemAdapter } from './model.state';
import { ProjectStatusNames } from '../project-store/project.model';
import * as ModelStoreActions from './model.actions';

export const modelStoreFeatureKey = 'model';

export const reducer = createReducer(
  initialState,

  on(ModelStoreActions.loadModels, (state) => ({ ...state, isLoading: true, error: null })),
  on(ModelStoreActions.loadModelById, (state) => ({ ...state, isLoading: true, error: null })),
  on(ModelStoreActions.loadModelsSuccess, (state, { items }) =>
    modelItemAdapter.setAll(items, {
      ...state,
      isLoading: false,
      error: null,
    })
  ),
  on(ModelStoreActions.loadModelByIdSuccess, (state, { modelItem }) =>
    modelItemAdapter.setOne(modelItem, {
      ...state,
      isLoading: false,
      error: null,
    })
  ),
  on(ModelStoreActions.loadSelectedModelById, (state) => ({
    ...state,
    selectedModel: null,
    isLoading: true,
    error: null,
  })),
  on(ModelStoreActions.loadSelectedModelByIdSuccess, (state, { modelItem }) => ({
    ...state,
    selectedModel: modelItem,
    isLoading: false,
    error: null,
  })),
  on(ModelStoreActions.uploadModelFailure, (state, { id, error }) => ({
    ...state,
    isLoading: false,
    error,
    uploadingIds: state.uploadingIds.filter((uploadingId) => uploadingId !== id),
  })),
  on(ModelStoreActions.loadModelsFailure, (state, { error }) => ({ ...state, isLoading: false, error })),
  on(ModelStoreActions.loadSelectedModelByIdFailure, (state, { error }) => ({ ...state, isLoading: false, error })),
  on(ModelStoreActions.loadModelByIdFailure, (state, { error }) => ({ ...state, isLoading: false, error })),
  on(ModelStoreActions.updateModelItem, (state, update) => {
    const { status } = update.changes;
    return modelItemAdapter.updateOne(update, {
      ...state,
      uploadingIds:
        status.name !== ProjectStatusNames.RUNNING
          ? state.uploadingIds.filter((uploadingId) => uploadingId !== update.id)
          : state.uploadingIds,
    });
  }),
  on(ModelStoreActions.startUploadModelSuccess, (state, { modelItem }) =>
    modelItemAdapter.upsertOne(modelItem, {
      ...state,
      importingModelId: modelItem.id,
      uploadingIds: [...state.uploadingIds, modelItem.id],
    })
  ),
  on(ModelStoreActions.downloadOMZModelSuccess, (state, { modelItem }) =>
    modelItemAdapter.upsertOne(modelItem, {
      ...state,
      importingModelId: modelItem.id,
    })
  ),
  on(ModelStoreActions.startUploadModelFailure, (state, { error }) => ({
    ...state,
    error,
  })),
  on(ModelStoreActions.downloadOMZModelFailure, (state, { error }) => ({
    ...state,
    error,
  })),
  on(ModelStoreActions.resetImportingModel, (state) => ({ ...state, importingModelId: null })),
  on(ModelStoreActions.updateAccuracyConfig, (state) => ({
    ...state,
    accuracyConfigSavePending: true,
  })),
  on(ModelStoreActions.updateAccuracyConfigSuccess, (state, { modelItem }) =>
    modelItemAdapter.updateOne(
      {
        id: modelItem.id,
        changes: {
          accuracyConfiguration: modelItem.accuracyConfiguration,
          visualizationConfiguration: modelItem.visualizationConfiguration,
        },
      },
      { ...state, accuracyConfigSavePending: false }
    )
  ),
  on(ModelStoreActions.updateAccuracyConfigFailure, (state) => ({
    ...state,
    accuracyConfigSavePending: false,
  })),
  on(ModelStoreActions.removeModelSuccess, (state, { id }) => modelItemAdapter.removeOne(id, { ...state })),
  on(ModelStoreActions.cancelModelUploadSuccess, (state, { id }) =>
    modelItemAdapter.updateOne(
      {
        id,
        changes: {
          status: {
            name: ProjectStatusNames.CANCELLED,
            progress: 0,
          },
        },
      },
      {
        ...state,
        uploadingIds: state.uploadingIds.filter((uploadingId) => uploadingId !== id),
      }
    )
  ),
  on(ModelStoreActions.setAvailableModelTransformationsConfigs, (state, { configs }) => ({
    ...state,
    availableTransformationsConfigs: configs,
  })),
  on(ModelStoreActions.resetModelMOAnalyzedParams, (state, { modelId }) =>
    modelItemAdapter.updateOne(
      {
        id: modelId,
        changes: {
          mo: {
            ...state.entities[modelId].mo,
            analyzedParams: null,
          },
        },
      },
      { ...state }
    )
  ),
  on(ModelStoreActions.loadOMZModels, (state) => ({
    ...state,
    omzModels: {
      ...state.omzModels,
      isLoading: true,
      error: null,
    },
  })),
  on(ModelStoreActions.loadOMZModelsSuccess, (state, { items }) => ({
    ...state,
    omzModels: modelDownloaderItemAdapter.setAll(items, {
      ...state.omzModels,
      isLoading: false,
      error: null,
    }),
  })),
  on(ModelStoreActions.loadOMZModelsFailure, (state, { error }) => ({
    ...state,
    omzModels: {
      ...state.omzModels,
      isLoading: false,
      error,
    },
  })),
  on(ModelStoreActions.resetOMZModels, (state) => ({
    ...state,
    omzModels: modelDownloaderItemAdapter.removeAll({ ...state.omzModels }),
  })),
  on(ModelStoreActions.startModelArchiving, (state, { modelId }) =>
    modelItemAdapter.updateOne(
      {
        id: modelId,
        changes: {
          isDownloading: true,
        },
      },
      { ...state }
    )
  ),
  on(ModelStoreActions.startModelDownloadSuccess, (state, { modelId }) =>
    modelItemAdapter.updateOne(
      {
        id: modelId,
        changes: {
          isDownloading: false,
        },
      },
      { ...state }
    )
  ),
  on(ModelStoreActions.configureModel, (state) => {
    return {
      ...state,
      isLoading: true,
      error: null,
    };
  }),
  on(ModelStoreActions.convertModel, (state) => {
    return {
      ...state,
      isLoading: true,
      error: null,
    };
  }),
  on(ModelStoreActions.convertModelFailure, (state, payload) => {
    const { error } = payload;

    return {
      ...state,
      isLoading: false,
      error: error,
    };
  }),
  on(ModelStoreActions.editModelConvert, (state) => {
    return {
      ...state,
      isLoading: true,
      error: null,
    };
  }),
  on(ModelStoreActions.editModelConvertFailure, (state, payload) => {
    const { error } = payload;

    return {
      ...state,
      isLoading: false,
      error: error,
    };
  }),
  on(ModelStoreActions.configureModelSuccess, (state) => {
    return {
      ...state,
      isLoading: false,
      error: null,
    };
  }),

  on(ModelStoreActions.configureModelStartFailure, ModelStoreActions.configureFailure, (state, payload) => {
    const { error } = payload;
    return {
      ...state,
      isLoading: false,
      error,
    };
  }),
  on(ModelStoreActions.setConfigurePipeline, (state, { data }) => ({
    ...state,
    runningConfigurePipeline: data,
  })),
  on(ModelStoreActions.removeConfigurePipeline, (state) => ({
    ...state,
    runningConfigurePipeline: null,
  })),
  on(ModelStoreActions.importHuggingfaceModelSuccess, (state, { model }) =>
    modelItemAdapter.upsertOne(model, {
      ...state,
      importingModelId: model.id,
    })
  ),
  on(ModelStoreActions.importHuggingfaceModelFailure, (state, { error }) => ({
    ...state,
    error,
  }))
);
