import { flatten } from '@angular/compiler';

import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { Dictionary } from '@ngrx/entity';
import { isEmpty } from 'lodash';

import { ICompoundInference } from '@store/inference-history-store/inference-history.model';

import { IInt8CalibrationPipeline } from '@shared/models/pipelines/int8-calibration-pipeline';
import { JobType } from '@shared/models/pipelines/pipeline';

import { projectAdapter, State as ProjectState } from './project.state';
import { State as AppState, ErrorState } from '../state';
import { ProjectItem, ProjectStatusNames } from './project.model';
import { selectParamProjectId, selectQueryProjectId, selectRouterState } from '../router-store/route.selectors';

export const getError = (state: ProjectState): ErrorState => state.error;

export const getIsLoading = (state: ProjectState): boolean => state.isLoading;

export const getReportGenerating = (state: ProjectState): boolean => state.isReportGenerating;

export const getDeploymentArchivePreparing = (state: ProjectState): boolean => state.isDeploymentArchivePreparing;

export const getExportRunning = (state: ProjectState): boolean => state.isExportRunning;

export const getSelectedProjectId = (state: ProjectState): number => state.selectedProject;

export const selectProjectState = createFeatureSelector<AppState, ProjectState>('project');

export const selectAllProjectItems: (state: AppState) => ProjectItem[] = projectAdapter.getSelectors(selectProjectState)
  .selectAll;

export const selectProjectItemsMap: (state: AppState) => Dictionary<ProjectItem> = projectAdapter.getSelectors(
  selectProjectState
).selectEntities;

export const selectProjectItemsIds = projectAdapter.getSelectors(selectProjectState).selectIds as (
  state: AppState
) => number[];

export const selectReadyProjectItems = createSelector(selectAllProjectItems, (allItems: ProjectItem[]) =>
  allItems.filter(
    (item) =>
      [ProjectStatusNames.READY, ProjectStatusNames.ARCHIVED].includes(item.status.name) && !!item.execInfo?.throughput
  )
);

export const selectInProgressProjectItems = createSelector(selectAllProjectItems, (projects) =>
  projects.filter((p) => p.status.name === ProjectStatusNames.RUNNING)
);

export const selectProjectById = createSelector(
  selectProjectItemsMap,
  (itemsMap: Dictionary<ProjectItem>, id: number) => (!isEmpty(itemsMap) ? itemsMap[id] : null)
);

export const selectProjectError: MemoizedSelector<object, ErrorState> = createSelector(selectProjectState, getError);

export const selectProjectIsLoading: MemoizedSelector<object, boolean> = createSelector(
  selectProjectState,
  getIsLoading
);

export const selectProjectReportGenerating: MemoizedSelector<object, boolean> = createSelector(
  selectProjectState,
  getReportGenerating
);

export const selectDeploymentArchivePreparing: MemoizedSelector<object, boolean> = createSelector(
  selectProjectState,
  getDeploymentArchivePreparing
);

export const selectExportRunning: MemoizedSelector<object, boolean> = createSelector(
  selectProjectState,
  getExportRunning
);

export const selectSelectedProjectId: MemoizedSelector<object, number> = createSelector(
  selectProjectState,
  getSelectedProjectId
);

export const selectSelectedProject: MemoizedSelector<object, ProjectItem> = createSelector(
  selectProjectItemsMap,
  selectSelectedProjectId,
  (projectsMap, id) => projectsMap[id]
);

export const selectParentProject: MemoizedSelector<object, ProjectItem | null> = createSelector(
  selectProjectItemsMap,
  selectSelectedProject,
  (itemsMap: Dictionary<ProjectItem>, selectedProject: ProjectItem) => {
    if (!selectedProject) {
      return null;
    }
    if (selectedProject.pathFromRoot.length === 0) {
      return selectedProject;
    }
    const [parentId] = selectedProject.pathFromRoot;
    return itemsMap[parentId] || null;
  }
);

export const selectChildProjects: MemoizedSelector<object, ProjectItem[]> = createSelector(
  selectProjectItemsMap,
  selectSelectedProject,
  (itemsMap: Dictionary<ProjectItem>, selectedProject: ProjectItem) => {
    if (!selectedProject) {
      return null;
    }

    const children = selectedProject.children.map((id) => itemsMap[id]);
    const childrenDescendants = children.map(({ children: descendants }) => descendants.map((id) => itemsMap[id]));

    return [...children, ...flatten(childrenDescendants)];
  }
);

export const getSelectedProjectByRouteParam: (
  state: AppState
) => ProjectItem | null = createSelector(
  selectProjectItemsMap,
  selectParamProjectId,
  (itemsMap: Dictionary<ProjectItem>, projectId) => (!isEmpty(itemsMap) ? itemsMap[projectId] : null)
);

export const getSelectedProjectByRouteQueryParam: (
  state: AppState
) => ProjectItem | null = createSelector(
  selectProjectItemsMap,
  selectQueryProjectId,
  (itemsMap: Dictionary<ProjectItem>, id) => (!isEmpty(itemsMap) ? itemsMap[id] : null)
);

export const selectRunningInt8CalibrationPipelinesPerProjectMap = createSelector(selectProjectState, (state) =>
  Object.values(state.runningInt8CalibrationPipelines.entities).reduce<{
    [projectId: number]: IInt8CalibrationPipeline;
  }>((acc, i) => {
    const job = i.jobs.find((j) => j.type === JobType.profiling_job) as ICompoundInference;
    acc[job.projectId] = i;
    return acc;
  }, {})
);

export const selectRunningInt8CalibrationPipelines = createSelector(selectProjectState, (state) =>
  Object.values(state.runningInt8CalibrationPipelines.entities)
);

export const getReadyCompareProjectByQueryParams = createSelector(
  selectProjectState,
  selectRouterState,
  (projectState, routerState, queryKey: string) => {
    const projectId = routerState.state.queryParams[queryKey];
    if (!projectId || !projectState.entities[projectId]) {
      return null;
    }
    const project = projectState.entities[projectId];
    return [ProjectStatusNames.READY, ProjectStatusNames.ARCHIVED].includes(project.status.name) &&
      !!project.execInfo?.throughput
      ? project
      : null;
  }
);
