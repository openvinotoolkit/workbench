import { keys } from 'lodash';
import { Action } from '@ngrx/store';

import { mockDatasetItemCommonFields } from '@store/dataset-store/dataset.selectors.spec';

import { reducer } from './dataset.reducer';
import { initialState } from './dataset.state';
import { DatasetStoreActions, DatasetStoreReducer } from './';
import { DatasetItem } from './dataset.model';

export const mockDatasetItemList = [
  {
    id: '2',
    name: 'VOC_small.tar',
    ...mockDatasetItemCommonFields,
  },
] as DatasetItem[];

describe('Dataset Reducer', () => {
  describe('an unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = reducer(initialState, action);

      expect(result).toBe(initialState);
    });
  });

  describe('LOAD_DATASET action', () => {
    it('should set loading to true', () => {
      const action = DatasetStoreActions.loadDatasets();

      const state = DatasetStoreReducer(initialState, action);

      expect(state.isLoading).toEqual(true);
      expect(state.entities).toEqual({});
      expect(state.error).toBeNull();
    });
  });

  describe('LOAD_DATASET_FAILURE action', () => {
    it('should set error', () => {
      const error = { message: 'Error' };
      const action = DatasetStoreActions.loadDatasetsFailure({ error });

      const loadAction = DatasetStoreActions.loadDatasets();
      const previousState = DatasetStoreReducer(initialState, loadAction);
      const state = DatasetStoreReducer(previousState, action);

      expect(state.error).toEqual(error);
      expect(state.isLoading).toEqual(false);
      expect(state.entities).toEqual({});
    });
  });

  describe('LOAD_DATASET_SUCCESS action', () => {
    it('should set all items', () => {
      const items = mockDatasetItemList as DatasetItem[];
      const action = DatasetStoreActions.loadDatasetsSuccess({ items });

      const loadAction = DatasetStoreActions.loadDatasets();
      const previousState = DatasetStoreReducer(initialState, loadAction);
      const state = DatasetStoreReducer(previousState, action);

      expect(keys(state.entities).length).toEqual(mockDatasetItemList.length);
      expect(state.ids.length).toEqual(mockDatasetItemList.length);

      expect(state.error).toBeNull();
      expect(state.isLoading).toEqual(false);
    });
  });
});
