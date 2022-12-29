import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { Dictionary } from '@ngrx/entity';
import { every, head, isEmpty, last, sortBy, values } from 'lodash';

import { ProjectStatusNames } from '@store/project-store/project.model';

import { IProfilingPipeline } from '@shared/models/pipelines/profiling-pipeline';
import { JobType } from '@shared/models/pipelines/pipeline';

import { inferenceResultAdapter, State as InferenceHistoryState } from './inference-history.state';
import { ErrorState, State as AppState } from '../state';
import { ICompoundInference, IInferenceResult } from './inference-history.model';

export const getError = (state: InferenceHistoryState): ErrorState => state.error;

export const getIsLoading = (state: InferenceHistoryState): boolean => state.isLoading;

export const getSelectedInferencePoint = (state: InferenceHistoryState) => state.selectedId;

export const getHiddenInferenceItemsIds = (state: InferenceHistoryState) => state.hiddenIds;

const selectInferenceHistoryState = createFeatureSelector<InferenceHistoryState>('inferenceHistory');

export const selectAllInferenceItems: (state: AppState) => IInferenceResult[] =
  inferenceResultAdapter.getSelectors(selectInferenceHistoryState).selectAll;

export const selectInferenceItemsMap: (state: AppState) => Dictionary<IInferenceResult> =
  inferenceResultAdapter.getSelectors(selectInferenceHistoryState).selectEntities;

export const selectInferenceError: MemoizedSelector<object, ErrorState> = createSelector(
  selectInferenceHistoryState,
  getError
);

export const selectInferenceIsLoading: MemoizedSelector<object, boolean> = createSelector(
  selectInferenceHistoryState,
  getIsLoading
);

export const selectSelectedInferencePoint = createSelector(selectInferenceHistoryState, getSelectedInferencePoint);

export const selectHiddenInferenceItems = createSelector(selectInferenceHistoryState, getHiddenInferenceItemsIds);

export const selectRunningInferenceOverlayId = createSelector(
  selectInferenceHistoryState,
  (state) => state.runningInferenceOverlayId
);

export const selectExecutedFilteredPoints = createSelector(selectInferenceHistoryState, (state) => {
  const filteredItems = Object.values(state.entities).filter(({ id }) => !state.hiddenIds.includes(id));

  return filteredItems.filter(({ throughput, status }) => !!throughput && status.name !== ProjectStatusNames.RUNNING);
});

export const selectExecutedInferencePoints = createSelector(selectAllInferenceItems, (items) =>
  items.filter((item) => !!item.throughput)
);

export const selectInferenceHistoryProjectId = createSelector(selectAllInferenceItems, (items) =>
  isEmpty(items) ? null : head(items).projectId
);

export const selectBestInferenceHistoryExecInfo = createSelector(selectAllInferenceItems, (allItems) => {
  if (isEmpty(allItems)) {
    return null;
  }
  const notNullPoints = allItems.filter((point) => every(values(point), (param) => param !== null));
  return last(sortBy(notNullPoints, ['throughput']));
});

export const selectBestFilteredInferenceHistoryExecInfo = createSelector(selectExecutedFilteredPoints, (allItems) => {
  if (isEmpty(allItems)) {
    return null;
  }
  return last(sortBy(allItems, ['throughput']));
});

export const selectRunningProfilingPipelines = createSelector(selectInferenceHistoryState, (state) =>
  Object.values(state.runningProfilingPipelines.entities)
);

export const selectRunningProfilingPipelinesPerProjectMap = createSelector(selectInferenceHistoryState, (state) =>
  Object.values(state.runningProfilingPipelines.entities).reduce<{
    [projectId: number]: IProfilingPipeline;
  }>((acc, i) => {
    const job = i.jobs.find((j) => j.type === JobType.profiling_job) as ICompoundInference;
    acc[job.projectId] = i;
    return acc;
  }, {})
);

export const selectBaselineInferencePoint = createSelector(selectAllInferenceItems, (inferences) =>
  inferences.find(({ batch, nireq }) => batch === 1 && nireq === 1)
);
