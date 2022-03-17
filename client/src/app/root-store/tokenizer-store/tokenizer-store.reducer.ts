import { createReducer, on } from '@ngrx/store';

import { ProjectStatusNames } from '@store/project-store/project.model';

import * as Actions from './tokenizer-store.actions';
import { initialState, State, tokenizerAdapter } from './tokenizer-store.state';

export const reducer = createReducer(
  initialState,

  // PER MODEL STORE

  // update tokenizer only if already exists in store, maintain per model loaded list
  on(Actions.uploadProgress, (state: State, { tokenizer }) => ({
    ...state,
    tokenizers: tokenizerAdapter.updateOne(
      {
        id: tokenizer.id,
        changes: tokenizer,
      },
      state.tokenizers
    ),
  })),
  on(Actions.cancelUpload, (state: State, { tokenizerId }) => ({
    ...state,
    pendingIds: [...state.pendingIds, tokenizerId],
  })),
  on(Actions.cancelUploadSuccess, (state: State, { tokenizerId }) => ({
    ...state,
    pendingIds: state.pendingIds.filter((id) => id !== tokenizerId),

    // uploadProgress socket message can be not sent due to cancellation issues, handle explicitly
    tokenizers: tokenizerAdapter.updateOne(
      {
        id: tokenizerId,
        changes: {
          status: {
            progress: 0,
            name: ProjectStatusNames.CANCELLED,
          },
        },
      },
      state.tokenizers
    ),
  })),

  // LOAD LIST

  on(Actions.load, (state: State) => ({
    ...state,
    tokenizers: tokenizerAdapter.getInitialState(),
    loading: true,
    error: null,
  })),
  on(Actions.loadSuccess, (state: State, { data }) => ({
    ...state,
    tokenizers: tokenizerAdapter.setAll(data, state.tokenizers),
    loading: false,
    error: null,
  })),
  on(Actions.loadFailure, (state: State, { error }) => ({
    ...state,
    tokenizers: tokenizerAdapter.getInitialState(),
    loading: false,
    error,
  })),

  // LOAD TOKENIZER

  on(Actions.loadTokenizer, (state: State) => ({
    ...state,
    tokenizers: tokenizerAdapter.getInitialState(),
    loading: true,
    error: null,
  })),
  on(Actions.loadTokenizerSuccess, (state: State, { tokenizer }) => ({
    ...state,
    tokenizers: tokenizerAdapter.setOne(tokenizer, state.tokenizers),
    loading: false,
    error: null,
  })),
  on(Actions.loadTokenizerFailure, (state: State, { error }) => ({
    ...state,
    tokenizers: tokenizerAdapter.getInitialState(),
    loading: false,
    error,
  })),

  // SELECT

  on(Actions.select, (state: State) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(Actions.selectSuccess, (state: State, { tokenizers }) => ({
    ...state,
    loading: false,
    tokenizers: tokenizerAdapter.setAll(tokenizers, state.tokenizers),
    error: null,
  })),
  on(Actions.selectFailure, (state: State, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // mark tokenizer as pending during delete
  on(Actions.remove, (state: State, { tokenizerId }) => ({
    ...state,
    pendingIds: [...state.pendingIds, tokenizerId],
  })),
  on(Actions.removeSuccess, (state: State, { tokenizerId }) => ({
    ...state,
    tokenizers: tokenizerAdapter.removeOne(tokenizerId, state.tokenizers),
    pendingIds: state.pendingIds.filter((id) => id !== tokenizerId),
  })),
  on(Actions.removeFailure, (state: State, { error, tokenizerId }) => ({
    ...state,
    pendingIds: state.pendingIds.filter((id) => id !== tokenizerId),
    error,
  })),

  on(Actions.reset, () => initialState)
);
