import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';

import { ErrorState } from '@store/state';

import { ITokenizer } from '@shared/models/tokenizer/tokenizer';

export const tokenizerAdapter: EntityAdapter<ITokenizer> = createEntityAdapter<ITokenizer>({
  selectId: (targetMachine) => targetMachine.id,
  sortComparer: (a: ITokenizer, b: ITokenizer): number => a.id - b.id,
});

export interface State {
  tokenizers: EntityState<ITokenizer>;
  loading: boolean;
  error: ErrorState;
  pendingIds: number[];
}

export const initialState: State = {
  tokenizers: tokenizerAdapter.getInitialState(),
  loading: false,
  error: null,
  pendingIds: [],
};
