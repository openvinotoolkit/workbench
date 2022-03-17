import { Action } from '@ngrx/store';

import { reducer } from './globals.reducer';
import { initialState } from './globals.state';
import { GlobalsStoreActions, GlobalsStoreReducer } from './';

describe('Globals Reducer', () => {
  describe('an unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = reducer(initialState, action);

      expect(result).toBe(initialState);
    });
  });

  describe('SET_TASK_IS_RUNNING action', () => {
    it('should set is running to true', () => {
      const action = GlobalsStoreActions.setTaskIsRunningAction();

      const state = GlobalsStoreReducer(initialState, action);

      expect(state.isRunning).toEqual(true);
    });
  });

  describe('RESET_TASK_IS_RUNNING action', () => {
    it('should set is running to false', () => {
      const action = GlobalsStoreActions.resetTaskIsRunningAction();

      const state = GlobalsStoreReducer(initialState, action);

      expect(state.isRunning).toEqual(false);
    });
  });
});
