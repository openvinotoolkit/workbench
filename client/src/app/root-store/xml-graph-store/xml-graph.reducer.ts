import { Action, createReducer, on } from '@ngrx/store';

import { ModelGraphType } from '@store/model-store/model.model';

import * as XmlGraphActions from './xml-graph.actions';
import { initialState, State } from './xml-graph.state';

export const xmlGraphStoreFeatureKey = 'xmlGraph';

const xmlGraphStoreReducer = createReducer(
  initialState,
  on(XmlGraphActions.setOriginalGraphIdAction, (state, { modelId }) => ({
    ...state,
    [ModelGraphType.ORIGINAL]: {
      id: modelId,
      xmlContent: null,
      isLoading: false,
      error: null,
    },
  })),
  on(XmlGraphActions.loadOriginalGraphAction, (state) => ({
    ...state,
    [ModelGraphType.ORIGINAL]: {
      ...state[ModelGraphType.ORIGINAL],
      xmlContent: null,
      isLoading: true,
      error: null,
    },
  })),
  on(XmlGraphActions.loadOriginalGraphSuccessAction, (state, { xmlContent }) => ({
    ...state,
    [ModelGraphType.ORIGINAL]: {
      ...state[ModelGraphType.ORIGINAL],
      xmlContent,
      isLoading: false,
      error: null,
    },
  })),
  on(XmlGraphActions.loadOriginalGraphFailureAction, (state, { error }) => ({
    ...state,
    [ModelGraphType.ORIGINAL]: {
      ...state[ModelGraphType.ORIGINAL],
      xmlContent: null,
      isLoading: false,
      error,
    },
  })),
  on(XmlGraphActions.setRuntimeGraphIdAction, (state, { inferenceResultId }) => ({
    ...state,
    [ModelGraphType.RUNTIME]: {
      id: inferenceResultId,
      xmlContent: null,
      isLoading: false,
      error: null,
    },
  })),
  on(XmlGraphActions.loadRuntimeGraphAction, (state) => ({
    ...state,
    [ModelGraphType.RUNTIME]: {
      ...state[ModelGraphType.RUNTIME],
      xmlContent: null,
      isLoading: true,
      error: null,
    },
  })),
  on(XmlGraphActions.loadRuntimeGraphSuccessAction, (state, { xmlContent }) => ({
    ...state,
    [ModelGraphType.RUNTIME]: {
      ...state[ModelGraphType.RUNTIME],
      xmlContent,
      isLoading: false,
      error: null,
    },
  })),
  on(XmlGraphActions.loadRuntimeGraphFailureAction, (state, { error }) => ({
    ...state,
    [ModelGraphType.RUNTIME]: {
      ...state[ModelGraphType.RUNTIME],
      xmlContent: null,
      isLoading: false,
      error,
    },
  })),
  on(XmlGraphActions.resetGraphsAction, () => ({
    ...initialState,
  }))
);

export function reducer(state: State | undefined, action: Action) {
  return xmlGraphStoreReducer(state, action);
}
