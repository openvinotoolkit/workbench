import { ModelGraphType } from '@store/model-store/model.model';
import { ErrorState } from '@store/state';

export interface BaseGraphState {
  id: number;
  xmlContent: string | null;
  isLoading: boolean;
  error?: ErrorState;
}

const initialGraphState: BaseGraphState = {
  id: null,
  xmlContent: null,
  isLoading: false,
  error: null,
};

export interface State {
  [ModelGraphType.ORIGINAL]: BaseGraphState;
  [ModelGraphType.RUNTIME]: BaseGraphState;
}

export const initialState: State = {
  [ModelGraphType.ORIGINAL]: initialGraphState,
  [ModelGraphType.RUNTIME]: initialGraphState,
};
