import { createFeatureSelector, createSelector } from '@ngrx/store';

import { ModelGraphType } from '@store/model-store/model.model';

import { BaseGraphState, State as XMLGraphState } from './xml-graph.state';
import * as fromXMLGraphStore from './xml-graph.reducer';

const selectXMLGraphState = createFeatureSelector<XMLGraphState>(fromXMLGraphStore.xmlGraphStoreFeatureKey);

const getGraphId = ({ id }: BaseGraphState) => id;

export const selectOriginalGraph = createSelector(
  selectXMLGraphState,
  (xmlGraphState) => xmlGraphState[ModelGraphType.ORIGINAL]
);

export const selectOriginalGraphId = createSelector(selectOriginalGraph, getGraphId);

export const selectRuntimeGraph = createSelector(
  selectXMLGraphState,
  (xmlGraphState) => xmlGraphState[ModelGraphType.RUNTIME]
);

export const selectRuntimeGraphId = createSelector(selectRuntimeGraph, getGraphId);
