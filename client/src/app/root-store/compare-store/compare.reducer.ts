import { createReducer, on } from '@ngrx/store';

import {
  IInferenceListState,
  IInferenceResultState,
  inferenceResultAdapter,
  initialState,
  State,
} from '@store/compare-store/compare.state';

import * as CompareStoreActions from './compare.actions';

export const compareFeatureKey = 'compare';

const inferenceListReducer = createReducer<IInferenceListState>(
  null,

  on(CompareStoreActions.loadInferenceList, (state) =>
    inferenceResultAdapter.setAll([], {
      ...state,
      loading: true,
      error: null,
    })
  ),
  on(CompareStoreActions.loadInferenceListSuccess, (state, { result }) =>
    inferenceResultAdapter.setAll(result, {
      ...state,
      loading: false,
      error: null,
    })
  ),
  on(CompareStoreActions.loadInferenceListFailure, (state, { error }) =>
    inferenceResultAdapter.setAll([], {
      ...state,
      loading: false,
      error,
    })
  )
);

const inferenceResultModelReducer = createReducer<IInferenceResultState>(
  null,

  on(CompareStoreActions.loadInferenceResult, (_) => ({ result: null, loading: true, error: null })),
  on(CompareStoreActions.loadInferenceResultSuccess, (state, { result }) => ({ result, loading: false, error: null })),
  on(CompareStoreActions.loadInferenceResultFailure, (state, { error }) => ({ result: null, loading: false, error }))
);

export const reducer = createReducer<State>(
  initialState,

  on(
    CompareStoreActions.loadInferenceList,
    CompareStoreActions.loadInferenceListSuccess,
    CompareStoreActions.loadInferenceListFailure,
    (state, action) => {
      return action.side === 'a'
        ? { ...state, inferenceListA: inferenceListReducer(state.inferenceListA, action) }
        : { ...state, inferenceListB: inferenceListReducer(state.inferenceListB, action) };
    }
  ),

  on(
    CompareStoreActions.loadInferenceResult,
    CompareStoreActions.loadInferenceResultSuccess,
    CompareStoreActions.loadInferenceResultFailure,
    (state, action) => {
      return action.side === 'a'
        ? { ...state, inferenceResultModelA: inferenceResultModelReducer(state.inferenceResultModelA, action) }
        : { ...state, inferenceResultModelB: inferenceResultModelReducer(state.inferenceResultModelB, action) };
    }
  ),

  on(CompareStoreActions.reset, () => ({ ...initialState }))
);
