import { createFeatureSelector, createSelector } from '@ngrx/store';

import { CompareSide, State } from '@store/compare-store/compare.state';
import { compareFeatureKey } from '@store/compare-store/compare.reducer';
import { IInferenceResult } from '@store/inference-history-store/inference-history.model';
import { ProjectStatusNames } from '@store/project-store/project.model';

export const selectCompareState = createFeatureSelector<State>(compareFeatureKey);

export const selectReadyInferenceList = createSelector(selectCompareState, (state, side: CompareSide) => {
  const inferences =
    side === 'a'
      ? Object.values<IInferenceResult>(state.inferenceListA.entities)
      : Object.values<IInferenceResult>(state.inferenceListB.entities);

  return inferences.filter((v) => v.status.name === ProjectStatusNames.READY);
});

export const selectAllReadyInferencesList = createSelector(selectCompareState, (state) =>
  [...Object.values(state.inferenceListA.entities), ...Object.values(state.inferenceListB.entities)].filter(
    (v) => v.status.name === ProjectStatusNames.READY
  )
);

export const selectResultModel = createSelector(selectCompareState, (state, side: CompareSide) =>
  side === 'a' ? state.inferenceResultModelA.result : state.inferenceResultModelB.result
);

export const isInferenceListLoading = createSelector(selectCompareState, (state, side: CompareSide) =>
  side === 'a' ? state.inferenceListA.loading : state.inferenceListB.loading
);

export const isInferenceResultLoading = createSelector(selectCompareState, (state, side: CompareSide) =>
  side === 'a' ? state.inferenceResultModelA.loading : state.inferenceResultModelB.loading
);
