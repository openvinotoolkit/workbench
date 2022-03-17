import { IRawAccuracyConfig } from '@store/advanced-accuracy-store/advanced-accuracy-store.models';
import { ErrorState } from '@store/state';

export interface State {
  config: IRawAccuracyConfig;
  loading: boolean;
  savePending: boolean;
  error: ErrorState;
}

export const initialState: State = {
  config: null,
  loading: false,
  savePending: false,
  error: null,
};
