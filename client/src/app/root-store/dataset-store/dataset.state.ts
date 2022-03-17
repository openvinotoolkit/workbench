import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';

import { ErrorState } from '@store/state';

import { DatasetItem, IUploadingImage } from './dataset.model';

export const datasetItemAdapter: EntityAdapter<DatasetItem> = createEntityAdapter<DatasetItem>({
  selectId: (dataset) => dataset.id,
  sortComparer: (a: DatasetItem, b: DatasetItem): number => a.name.toString().localeCompare(b.name.toString()),
});

export interface State extends EntityState<DatasetItem> {
  isLoading: boolean;
  error: ErrorState;
  uploadingIds: number[];
  defaultDatasetImages: Blob[];
}

export const initialState: State = datasetItemAdapter.getInitialState({
  isLoading: false,
  error: null,
  uploadingIds: [],
  defaultDatasetImages: null,
});
