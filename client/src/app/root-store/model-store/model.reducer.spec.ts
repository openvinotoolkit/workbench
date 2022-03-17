import { Action } from '@ngrx/store';
import { keys } from 'lodash';

import { reducer } from './model.reducer';
import { initialState } from './model.state';
import { ModelStoreActions, ModelStoreReducer } from './';
import { ModelFrameworks, ModelItem, ModelSources } from './model.model';
import { ProjectStatusNames } from '../project-store/project.model';

export const mockModelItemList = [
  {
    id: 1,
    name: 'MobileNet SSD',
    date: 1557233647.512492,
    path: '/path/to/models/id',
    status: {
      name: ProjectStatusNames.READY,
      progress: 100,
    },
    size: 34,
    accuracyConfiguration: {},
    modelSource: ModelSources.IR,
    framework: ModelFrameworks.OPENVINO,
    isConfigured: true,
  },
] as ModelItem[];

describe('Model Reducer', () => {
  describe('an unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = reducer(initialState, action);

      expect(result).toBe(initialState);
    });
  });

  describe('LOAD_MODELS action', () => {
    it('should set loading to true', () => {
      const action = ModelStoreActions.loadModels();

      const state = ModelStoreReducer(initialState, action);

      expect(state.isLoading).toEqual(true);
      expect(state.entities).toEqual({});
      expect(state.error).toBeNull();
    });
  });

  describe('LOAD_MODELS_FAILURE action', () => {
    it('should set error', () => {
      const error = { message: 'Error' };
      const action = ModelStoreActions.loadModelsFailure({ error });

      const loadAction = ModelStoreActions.loadModels();
      const previousState = ModelStoreReducer(initialState, loadAction);
      const state = ModelStoreReducer(previousState, action);

      expect(state.error).toEqual(error);
      expect(state.isLoading).toEqual(false);
      expect(state.entities).toEqual({});
    });
  });

  describe('LOAD_MODELS_SUCCESS action', () => {
    it('should set all items', () => {
      const action = ModelStoreActions.loadModelsSuccess({ items: mockModelItemList });

      const loadAction = ModelStoreActions.loadModels();
      const previousState = ModelStoreReducer(initialState, loadAction);
      const state = ModelStoreReducer(previousState, action);

      expect(keys(state.entities).length).toEqual(mockModelItemList.length);
      expect(state.ids.length).toEqual(mockModelItemList.length);

      expect(state.error).toBeNull();
      expect(state.isLoading).toEqual(false);
    });
  });
});
