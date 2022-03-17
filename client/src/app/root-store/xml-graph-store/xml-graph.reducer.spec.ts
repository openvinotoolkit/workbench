import { Action } from '@ngrx/store';

import { ModelGraphType } from '@store/model-store/model.model';

import { reducer } from './xml-graph.reducer';
import { initialState } from './xml-graph.state';
import { XMLGraphStoreActions, XMLGraphStoreReducer, XMLGraphStoreState } from './';

const originalModelGraphType = ModelGraphType.ORIGINAL;
const runtimeModelGraphType = ModelGraphType.RUNTIME;

describe('XML Graph Reducer', () => {
  describe('an unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = reducer(initialState, action);

      expect(result).toBe(initialState);
    });
  });

  describe('setOriginalGraphIdAction action', () => {
    it('should set graph id and reset content', () => {
      const graphId = 1;

      const action = XMLGraphStoreActions.setOriginalGraphIdAction({ modelId: graphId });
      const state: XMLGraphStoreState.State = XMLGraphStoreReducer(initialState, action);

      expect(state[originalModelGraphType].id).toEqual(graphId);
      expect(state[originalModelGraphType].xmlContent).toEqual(null);
      expect(state[originalModelGraphType].isLoading).toEqual(false);
      expect(state[originalModelGraphType].error).toEqual(null);
    });
  });

  describe('loadOriginalGraphAction action', () => {
    it('should set loading to true', () => {
      const action = XMLGraphStoreActions.loadOriginalGraphAction();
      const state: XMLGraphStoreState.State = XMLGraphStoreReducer(initialState, action);

      expect(state[originalModelGraphType].isLoading).toEqual(true);
      expect(state[originalModelGraphType].error).toEqual(null);
    });
  });

  describe('loadOriginalGraphSuccessAction action', () => {
    it('should set xml content', () => {
      const xmlContent = '<xml>1</xml>';
      const action = XMLGraphStoreActions.loadOriginalGraphSuccessAction({ xmlContent });
      const state: XMLGraphStoreState.State = XMLGraphStoreReducer(initialState, action);

      expect(state[originalModelGraphType].xmlContent).toEqual(xmlContent);
      expect(state[originalModelGraphType].isLoading).toEqual(false);
      expect(state[originalModelGraphType].error).toEqual(null);
    });
  });

  describe('loadOriginalGraphFailureAction action', () => {
    it('should set xml content', () => {
      const error = 'error';
      const action = XMLGraphStoreActions.loadOriginalGraphFailureAction({ error });
      const state: XMLGraphStoreState.State = XMLGraphStoreReducer(initialState, action);

      expect(state[originalModelGraphType].isLoading).toEqual(false);
      expect(state[originalModelGraphType].error).toEqual(error);
    });
  });

  describe('setRuntimeGraphIdAction action', () => {
    it('should set graph id and reset content', () => {
      const graphId = 1;

      const action = XMLGraphStoreActions.setRuntimeGraphIdAction({ inferenceResultId: graphId });
      const state: XMLGraphStoreState.State = XMLGraphStoreReducer(initialState, action);

      expect(state[runtimeModelGraphType].id).toEqual(graphId);
      expect(state[runtimeModelGraphType].xmlContent).toEqual(null);
      expect(state[runtimeModelGraphType].isLoading).toEqual(false);
      expect(state[runtimeModelGraphType].error).toEqual(null);
    });
  });

  describe('loadRuntimeGraphAction action', () => {
    it('should set loading to true', () => {
      const action = XMLGraphStoreActions.loadRuntimeGraphAction();
      const state: XMLGraphStoreState.State = XMLGraphStoreReducer(initialState, action);

      expect(state[runtimeModelGraphType].isLoading).toEqual(true);
      expect(state[runtimeModelGraphType].error).toEqual(null);
    });
  });

  describe('loadRuntimeGraphSuccessAction action', () => {
    it('should set xml content', () => {
      const xmlContent = '<xml>2</xml>';
      const action = XMLGraphStoreActions.loadRuntimeGraphSuccessAction({ xmlContent });
      const state: XMLGraphStoreState.State = XMLGraphStoreReducer(initialState, action);

      expect(state[runtimeModelGraphType].xmlContent).toEqual(xmlContent);
      expect(state[runtimeModelGraphType].isLoading).toEqual(false);
      expect(state[runtimeModelGraphType].error).toEqual(null);
    });
  });

  describe('loadRuntimeGraphFailureAction action', () => {
    it('should set xml content', () => {
      const error = 'error';
      const action = XMLGraphStoreActions.loadRuntimeGraphFailureAction({ error });
      const state: XMLGraphStoreState.State = XMLGraphStoreReducer(initialState, action);

      expect(state[runtimeModelGraphType].isLoading).toEqual(false);
      expect(state[runtimeModelGraphType].error).toEqual(error);
    });
  });

  describe('resetGraphsAction action', () => {
    it('should reset all original graph parameters', () => {
      const action = XMLGraphStoreActions.resetGraphsAction();
      const state: XMLGraphStoreState.State = XMLGraphStoreReducer(initialState, action);

      expect(state[originalModelGraphType].id).toEqual(null);
      expect(state[originalModelGraphType].xmlContent).toEqual(null);
      expect(state[originalModelGraphType].isLoading).toEqual(false);
      expect(state[originalModelGraphType].error).toEqual(null);
    });

    it('should reset all runtime graph parameters', () => {
      const action = XMLGraphStoreActions.resetGraphsAction();
      const state: XMLGraphStoreState.State = XMLGraphStoreReducer(initialState, action);

      expect(state[runtimeModelGraphType].id).toEqual(null);
      expect(state[runtimeModelGraphType].xmlContent).toEqual(null);
      expect(state[runtimeModelGraphType].isLoading).toEqual(false);
      expect(state[runtimeModelGraphType].error).toEqual(null);
    });
  });
});
