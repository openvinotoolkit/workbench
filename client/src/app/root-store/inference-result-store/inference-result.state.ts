import { ErrorState } from '@store/state';

import { InferenceResultModel } from './inference-result.model';

export interface State {
  selectedInferenceResult: InferenceResultModel | null;
  inferenceResultForComparison: InferenceResultModel | null;
  isLoading?: boolean;
  isReportGenerating?: boolean;
  error?: ErrorState;
}

export const initialState: State = {
  selectedInferenceResult: null,
  inferenceResultForComparison: null,
  isLoading: false,
  isReportGenerating: false,
  error: null,
};
