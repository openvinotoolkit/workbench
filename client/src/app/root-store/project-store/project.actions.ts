import { createAction, props } from '@ngrx/store';
import { Update } from '@ngrx/entity';

import { ErrorState } from '@store/state';
import { IAccuracyPipeline } from '@store/accuracy-analysis-store/accuracy-analysis-store.models';

import { AccuracyReportType } from '@shared/models/accuracy-analysis/accuracy-report';

import { ProjectExecInfo, ProjectItem, ProjectStatus, ProjectStatusNames } from './project.model';

export const loadActiveProjects = createAction('[Project] Load Active Projects');

export const loadProjectsForModel = createAction('[Project] Load Projects For Model', props<{ modelId: number }>());

export const loadProjectsForProject = createAction(
  '[Project] Load Project For Project',
  props<{ projectId: number }>()
);

export const loadProjectsSuccess = createAction('[Project] Load Projects Success', props<{ items: ProjectItem[] }>());

export const loadProjectsFailure = createAction('[Project] Load Projects Failure', props<{ error: ErrorState }>());

export const toggleExpandProject = createAction('[Project] Toggle Expand Project', props<{ id: number }>());

export const toggleExpandProjectWithChildren = createAction(
  '[Project] Toggle Expand Project With Children',
  props<{ updates: Update<ProjectItem>[] }>()
);

export const deleteProject = createAction('[Project] Delete Project', props<{ id: number }>());

export const deleteProjectSuccess = createAction('[Project] Delete Project Success', props<{ id: number }>());

export const deleteProjectFailure = createAction('[Project] Delete Project Failure', props<{ error: ErrorState }>());

export const deleteProjectWithChildren = createAction(
  '[Project] Delete Project With Children',
  props<{ idsToDelete: number[]; updates: Update<ProjectItem>[] }>()
);

export const selectProject = createAction('[Project] Select Project', props<{ id: number }>());

export const resetSelectedProject = createAction('[Project] Reset Selected Project');

// TODO Consider moving to accuracy analysis store actions
export const onAccuracySocketMessage = createAction(
  '[Project] On Accuracy Socket Message',
  props<{ message: IAccuracyPipeline }>()
);

export const updateProjectParameters = createAction(
  '[Project] Update Project Parameters',
  props<{ id: number; status?: ProjectStatus; execInfo?: Partial<ProjectExecInfo> }>()
);

// TODO Consider moving to accuracy analysis store actions
export const reportAccuracyGA = createAction(
  '[Project] Report Accuracy To GA',
  props<{
    projectId: number;
    accuracyReportType: AccuracyReportType;
    status: ProjectStatusNames.READY | ProjectStatusNames.ERROR | ProjectStatusNames.QUEUED;
  }>()
);

export const reportComparisonGA = createAction(
  '[Project] Report Comparison To GA',
  props<{ modelId: number; projectA: number; projectB: number }>()
);

export const reportOptimizationGA = createAction(
  '[Project] Report Optimization To GA',
  props<{ projectId: number; targetId: number; originalModelId: number; datasetId: number }>()
);
