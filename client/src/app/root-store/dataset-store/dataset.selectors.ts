import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Dictionary } from '@ngrx/entity';
import { filter, includes, isEmpty, mapValues } from 'lodash';

import { ModelTaskTypes } from '@store/model-store/model.model';
import { ProjectStatusNames } from '@store/project-store/project.model';

import { datasetItemAdapter, State as DatasetState } from './dataset.state';
import { State as AppState } from '../state';
import { DatasetItem, DatasetTypes } from './dataset.model';
import { selectQueryDatasetId } from '../router-store/route.selectors';

const selectDatasetState = createFeatureSelector<DatasetState>('dataset');

export const selectAllDatasets: (state: AppState) => DatasetItem[] =
  datasetItemAdapter.getSelectors(selectDatasetState).selectAll;

const selectDatasetsEntities: (state: AppState) => Dictionary<DatasetItem> =
  datasetItemAdapter.getSelectors(selectDatasetState).selectEntities;

export const selectDatasetIdToNameMap = createSelector(selectDatasetsEntities, (datasetsMap) =>
  mapValues(datasetsMap, (dataset) => dataset.name)
);

export const selectDatasetById = createSelector(
  selectDatasetsEntities,
  (itemsMap: Dictionary<DatasetItem>, id: number) => (!isEmpty(itemsMap) ? itemsMap[id] : null)
);

export const selectDatasetsByIds = createSelector(
  selectDatasetsEntities,
  (itemsMap: Dictionary<DatasetItem>, ids: number[]) => filter(itemsMap, (datasetItem) => includes(ids, datasetItem.id))
);

export const selectCompatibleDatasets = createSelector(
  selectDatasetsEntities,
  (itemsMap: Dictionary<DatasetItem>, { type, persistId }: { type: ModelTaskTypes; persistId: number }) => {
    return filter(
      itemsMap,
      (dataset) =>
        includes(dataset.tasks, type) || dataset.type === DatasetTypes.NOT_ANNOTATED || dataset.id === persistId
    );
  }
);
export const selectLoadingDatasets = createSelector(selectDatasetsEntities, (itemsMap: Dictionary<DatasetItem>) => {
  return filter(itemsMap, (datasetItem) => datasetItem.status.name === ProjectStatusNames.RUNNING);
});

export const getSelectedDatasetByQueryParam: (state: AppState) => DatasetItem | null = createSelector(
  selectDatasetsEntities,
  selectQueryDatasetId,
  (itemsMap: Dictionary<DatasetItem>, datasetId) => (!isEmpty(itemsMap) ? itemsMap[datasetId] : null)
);

export const selectUploadingDatasetIds = createSelector(selectDatasetState, (state) => state.uploadingIds);

export const selectDefaultDatasetImages = createSelector(selectDatasetState, (state) => state.defaultDatasetImages);
