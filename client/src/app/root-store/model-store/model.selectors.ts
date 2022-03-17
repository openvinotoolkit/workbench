import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { Dictionary } from '@ngrx/entity';
import { filter, find, get, isEmpty, map, mapValues, omit, set, startsWith } from 'lodash';

import { selectParamModelId, selectQueryModelId } from '@store/router-store/route.selectors';
import { modelStoreFeatureKey } from '@store/model-store/model.reducer';

import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';

import { modelDownloaderItemAdapter, modelItemAdapter, State as ModelState } from './model.state';
import { State as AppState } from '../state';
import { ModelFrameworks, ModelItem, tfFlavorsToPrefixMap, TransformationsConfig } from './model.model';

const selectModelState = createFeatureSelector<AppState, ModelState>(modelStoreFeatureKey);

export const selectAllModels: (state: AppState) => ModelItem[] = modelItemAdapter.getSelectors(selectModelState)
  .selectAll;

const selectModelsEntities: (state: AppState) => Dictionary<ModelItem> = modelItemAdapter.getSelectors(selectModelState)
  .selectEntities;

export const selectAccuracySavePending = createSelector(selectModelState, (state) => state.accuracyConfigSavePending);

export const selectModelIdToNameMap = createSelector(selectModelsEntities, (modelsMap) =>
  mapValues(modelsMap, (model) => model.name)
);

const selectAvailableTransformationsConfigs: MemoizedSelector<object, TransformationsConfig[]> = createSelector(
  selectModelState,
  (state: ModelState) => state.availableTransformationsConfigs
);

const getAvailableTransformationsConfig = (
  modelItem: ModelItem,
  configs: TransformationsConfig[]
): TransformationsConfig[] => {
  const modelConfigs = filter(configs, ({ framework }) => framework === modelItem.originalModelFramework);
  const tfFlavor = get(modelItem, 'mo.analyzedParams.model_type.TF_OD_API.flavor');

  return modelItem.originalModelFramework === ModelFrameworks.TF && tfFlavor
    ? modelConfigs.filter(({ name }) => startsWith(name, tfFlavorsToPrefixMap[tfFlavor]))
    : modelConfigs;
};

const getModelItemByIdAndPopulateWithTransformationsConfig = (
  itemsMap: Dictionary<ModelItem>,
  configs: TransformationsConfig[] | null,
  id: number
) => {
  if (isEmpty(itemsMap) || !itemsMap[id]) {
    return null;
  }
  const modelItem = itemsMap[id];

  const availableTransformationsConfig = getAvailableTransformationsConfig(modelItem, configs);

  if (availableTransformationsConfig.length) {
    set(modelItem, 'mo.availableTransformationsConfigs', availableTransformationsConfig);
  }

  return modelItem;
};

export const selectModelById = createSelector(
  selectModelsEntities,
  selectAvailableTransformationsConfigs,
  getModelItemByIdAndPopulateWithTransformationsConfig
);

export const selectSelectedProjectModel = createSelector(selectModelState, (state) => state.selectedModel);

export const selectImportingModelId: MemoizedSelector<object, number> = createSelector(
  selectModelState,
  (state: ModelState) => state.importingModelId
);

export const selectImportingModel: MemoizedSelector<object, Partial<ModelItem>> = createSelector(
  selectModelsEntities,
  selectAvailableTransformationsConfigs,
  selectImportingModelId,
  (itemsMap: Dictionary<ModelItem>, configs: TransformationsConfig[] | null, id: number): Partial<ModelItem> | null => {
    const modelItem = getModelItemByIdAndPopulateWithTransformationsConfig(itemsMap, configs, id);
    return modelItem ? omit(modelItem, ['progress', 'readiness', 'size']) : null;
  }
);

export const selectOMZModels: (state: AppState) => ModelDownloaderDTO[] = modelDownloaderItemAdapter.getSelectors(
  createSelector(selectModelState, (state: ModelState) => state.omzModels)
).selectAll;

export const selectOMZModelsAreLoading: (state: AppState) => boolean = createSelector(
  selectModelState,
  (state: ModelState) => state.omzModels.isLoading
);

export const selectDownloadingModelIds: (state: AppState) => number[] = createSelector(
  selectModelsEntities,
  (modelItems: Dictionary<ModelItem>): number[] => {
    const downloadingModels = filter(modelItems, (model: ModelItem) => model.isDownloading);
    return map(downloadingModels, 'id');
  }
);

export const getSelectedModelByQueryParam: (state: AppState) => ModelItem | null = createSelector(
  selectModelsEntities,
  selectQueryModelId,
  (itemsMap: Dictionary<ModelItem>, modelId) => (!isEmpty(itemsMap) ? itemsMap[modelId] : null)
);

export const getSelectedModelByParam: (state: AppState) => ModelItem | null = createSelector(
  selectModelsEntities,
  selectParamModelId,
  (itemsMap: Dictionary<ModelItem>, id) => (!isEmpty(itemsMap) ? itemsMap[id] : null)
);

export const selectUploadingModelIds = createSelector(selectModelState, (state) => state.uploadingIds);

export const selectModelByModelOptimizerJobId = createSelector(
  selectModelsEntities,
  (modelItems: Dictionary<ModelItem>, modelOptimizerJobId: number) =>
    find(modelItems, (model) => model.modelOptimizerJobId === modelOptimizerJobId)
);

export const selectModelError = createSelector(selectModelState, ({ error }) => error);

export const selectRunningConfigurePipeline = createSelector(
  selectModelState,
  (state) => state.runningConfigurePipeline
);

export const selectModelIsLoading: (state: AppState) => boolean = createSelector(
  selectModelState,
  (state: ModelState) => state.isLoading
);
