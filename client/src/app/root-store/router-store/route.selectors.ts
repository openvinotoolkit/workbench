import { createFeatureSelector, createSelector } from '@ngrx/store';

import { initialState, MergedRouteReducerState, Route } from './route.state';
import { State as AppState } from '../state';

export const selectRouterState = createFeatureSelector<AppState, MergedRouteReducerState>('router');
export const getMergedRoute = createSelector(selectRouterState, (routerReducerState) =>
  routerReducerState ? routerReducerState.state : initialState.state
);

export const selectQueryModelId = createSelector(getMergedRoute, (rootState: Route) => rootState.queryParams.modelId);

export const selectQueryDatasetId = createSelector(
  getMergedRoute,
  (rootState: Route) => rootState.queryParams.datasetId
);

export const selectQueryProjectId = createSelector(
  getMergedRoute,
  (rootState: Route) => rootState.queryParams.projectId
);

export const selectParamModelId = createSelector(getMergedRoute, (rootState: Route) => rootState.params.modelId);

export const selectParamProjectId = createSelector(getMergedRoute, (rootState: Route) => rootState.params.projectId);

export const selectUrl = createSelector<AppState, Route, string>(getMergedRoute, (rootState: Route) => rootState.url);

export const selectTokenQueryParam = createSelector<AppState, Route, string>(
  getMergedRoute,
  (rootState: Route) => rootState.queryParams.token
);

export const selectOptimizationQueryParam = createSelector<AppState, Route, string>(
  getMergedRoute,
  (rootState: Route) => rootState.queryParams.optimization
);

export const selectPresetQueryParam = createSelector<AppState, Route, string>(
  getMergedRoute,
  (rootState: Route) => rootState.queryParams.preset
);

export const selectLossQueryParam = createSelector<AppState, Route, string>(
  getMergedRoute,
  (rootState: Route) => rootState.queryParams.loss
);

export const selectParamTargetId = createSelector(getMergedRoute, (rootState: Route) => rootState.params.targetId);

export const selectQueryParamTargetId = createSelector(
  getMergedRoute,
  (rootState: Route) => rootState.queryParams.targetId
);

export const selectQueryParamStage = createSelector(getMergedRoute, (rootState: Route) => rootState.queryParams.stage);
