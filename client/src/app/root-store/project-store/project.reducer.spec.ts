import { cloneDeep, keys } from 'lodash';
import { Action } from '@ngrx/store';

import { startDeployment } from '@store/project-store/deployment.actions';

import { OSTypeNames } from '@shared/models/device';

import { ProjectStoreActions, ProjectStoreReducer } from './';
import { mockProjectItemList } from './project-data.mock';
import { ProjectItem, ProjectStatusNames } from './project.model';
import { reducer } from './project.reducer';
import { initialState } from './project.state';

describe('Project Reducer', () => {
  describe('an unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = reducer(initialState, action);

      expect(result).toBe(initialState);
    });
  });

  describe('LOAD_ACTIVE_PROJECTS, LOAD_PROJECTS_FOR_MODEL, DELETE_PROJECT actions', () => {
    it('should set loading to true', () => {
      const actions = [
        ProjectStoreActions.loadActiveProjects(),
        ProjectStoreActions.loadProjectsForModel({ modelId: 1 }),
        ProjectStoreActions.deleteProject({ id: null }),
      ];

      actions.forEach((action) => {
        const state = ProjectStoreReducer(initialState, action);

        expect(state.isLoading).toEqual(true);
        expect(state.entities).toEqual({});
        expect(state.error).toBeNull();
        expect(state.selectedProject).toBeNull();
      });
    });
  });

  describe('LOAD_PROJECTS_FAILURE, DELETE_PROJECT_FAILURE actions', () => {
    it('should set error', () => {
      const error = { message: 'Error' };
      const actions = [
        ProjectStoreActions.loadProjectsFailure({ error }),
        ProjectStoreActions.deleteProjectFailure({ error }),
      ];

      actions.forEach((action) => {
        const loadAction = ProjectStoreActions.loadActiveProjects();
        const previousState = ProjectStoreReducer(initialState, loadAction);
        const state = ProjectStoreReducer(previousState, action);

        expect(state.error).toEqual(error);
        expect(state.isLoading).toEqual(false);
        expect(state.entities).toEqual({});
        expect(state.selectedProject).toBeNull();
      });
    });
  });

  describe('LOAD_PROJECTS_SUCCESS action', () => {
    it('should set all items', () => {
      const items = mockProjectItemList as ProjectItem[];
      const action = ProjectStoreActions.loadProjectsSuccess({ items });

      const loadAction = ProjectStoreActions.loadActiveProjects();
      const previousState = ProjectStoreReducer(initialState, loadAction);
      const state = ProjectStoreReducer(previousState, action);

      expect(keys(state.entities).length).toEqual(mockProjectItemList.length);
      expect(state.ids.length).toEqual(mockProjectItemList.length);

      expect(state.error).toBeNull();
      expect(state.isLoading).toEqual(false);
      expect(state.selectedProject).toBeNull();
    });
  });

  describe('SELECT_PROJECT action', () => {
    it('should set selected item id', () => {
      const id = 1;
      const action = ProjectStoreActions.selectProject({ id });
      const state = ProjectStoreReducer(initialState, action);
      expect(state.selectedProject).toEqual(id);
    });
  });

  describe('startDeployment action', () => {
    it('should set project queued status', () => {
      const copy = cloneDeep(initialState);
      copy.entities = mockProjectItemList.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});

      const state = ProjectStoreReducer(
        copy,
        startDeployment({
          config: {
            projectId: 1,
            includeModel: false,
            pythonBindings: false,
            installScripts: false,
            targetOS: OSTypeNames.UBUNTU18,
            targets: [],
          },
        })
      );

      expect(state.entities[1].status.name).toEqual(ProjectStatusNames.QUEUED);
    });
  });
});
