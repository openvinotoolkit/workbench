import { IHFModelsData } from '@core/services/api/rest/huggingface.service';

import { ErrorState } from '@store/state';

export interface State {
  modelsData: IHFModelsData;
  isModelsDataLoading: boolean;
  modelsDataError: ErrorState;
  modelReadme: string;
  isLoadingReadme: boolean;
  modelReadmeError: ErrorState;
}

export const initialState: State = {
  modelsData: null,
  isModelsDataLoading: false,
  modelsDataError: null,
  modelReadme: null,
  isLoadingReadme: false,
  modelReadmeError: null,
};
