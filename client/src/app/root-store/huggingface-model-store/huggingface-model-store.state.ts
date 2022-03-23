import { IHFModelsData } from '@core/services/api/rest/huggingface.service';

import { ErrorState } from '@store/state';

export interface State {
  modelsData: IHFModelsData;
  isLoading: boolean;
  error: ErrorState;
  modelReadme: string;
  isLoadingReadme: boolean;
  modelReadmeError: ErrorState;
}

export const initialState: State = {
  modelsData: null,
  isLoading: false,
  error: null,
  modelReadme: null,
  isLoadingReadme: false,
  modelReadmeError: null,
};
