import { createEntityAdapter, EntityState } from '@ngrx/entity';

import { IAccuracyPipeline } from '@store/accuracy-analysis-store/accuracy-analysis-store.models';
import { ErrorState } from '@store/state';

import { IAccuracyReport } from '@shared/models/accuracy-analysis/accuracy-report';

export const accuracyPipelineAdapter = createEntityAdapter<IAccuracyPipeline>({
  selectId: (pipeline) => pipeline.id,
  sortComparer: (a, b): number => a.id - b.id,
});

export interface State {
  reports: IAccuracyReport[];
  runningAccuracyPipelines: EntityState<IAccuracyPipeline>;
  isLoading: boolean;
  error: ErrorState;
}

export const initialState: State = {
  reports: [],
  runningAccuracyPipelines: accuracyPipelineAdapter.getInitialState(),
  isLoading: false,
  error: null,
};
