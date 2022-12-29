import { createFeatureSelector, createSelector } from '@ngrx/store';

import { FEATURE_KEY } from './index';
import { State } from './tokenizer-store.state';

const selectState = createFeatureSelector<State>(FEATURE_KEY);

export const selectTokenizers = createSelector(selectState, (state) => Object.values(state.tokenizers.entities));
export const selectTokenizer = (id: number) => createSelector(selectState, (state) => state.tokenizers.entities[id]);
export const selectLoading = createSelector(selectState, (state) => state.loading);
export const selectPendingIds = createSelector(selectState, (state) => state.pendingIds);
export const selectSelectedTokenizer = createSelector(selectTokenizers, (tokenizers) =>
  tokenizers.find(({ selected }) => !!selected)
);
