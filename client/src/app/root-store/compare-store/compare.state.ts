import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';

import { IInferenceResult } from '@store/inference-history-store/inference-history.model';
import { InferenceResultModel } from '@store/inference-result-store/inference-result.model';
import { ErrorState } from '@store/state';

export const inferenceResultAdapter: EntityAdapter<IInferenceResult> = createEntityAdapter<IInferenceResult>({
  selectId: (item) => item.id,
  sortComparer: (a: IInferenceResult, b: IInferenceResult): number => a.throughput - b.throughput,
});

export type CompareSide = 'a' | 'b';

export interface IInferenceListState extends EntityState<IInferenceResult> {
  loading: boolean;
  error: ErrorState;
}

export interface IInferenceResultState {
  result: InferenceResultModel;
  loading: boolean;
  error: ErrorState;
}

export interface State {
  inferenceListA: IInferenceListState;
  inferenceListB: IInferenceListState;
  inferenceResultModelA: IInferenceResultState;
  inferenceResultModelB: IInferenceResultState;
}

export const initialState: State = {
  inferenceListA: inferenceResultAdapter.getInitialState({
    loading: false,
    error: null,
  }),
  inferenceListB: inferenceResultAdapter.getInitialState({
    loading: false,
    error: null,
  }),
  inferenceResultModelA: {
    result: null,
    loading: false,
    error: null,
  },
  inferenceResultModelB: {
    result: null,
    loading: false,
    error: null,
  },
};
