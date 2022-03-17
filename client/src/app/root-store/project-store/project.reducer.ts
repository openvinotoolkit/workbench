import { createReducer, on } from '@ngrx/store';

import * as DeployActions from '@store/project-store/deployment.actions';
import * as Int8CalibrationActions from '@store/project-store/int8-calibration.actions';
import { ProjectStatus, ProjectStatusNames } from '@store/project-store/project.model';
import * as ExportProjectReportActions from '@store/project-store/export-report.actions';
import * as ExportProjectActions from '@store/project-store/export-project.actions';

import * as ProjectActions from './project.actions';
import { initialState, int8CalibrationPipelineAdapter, projectAdapter } from './project.state';

export const reducer = createReducer(
  initialState,

  on(ProjectActions.loadActiveProjects, (state) => ({ ...state, isLoading: true, error: null })),
  on(ProjectActions.loadProjectsForModel, (state) => ({ ...state, isLoading: true, error: null })),
  on(ProjectActions.deleteProject, (state) => ({ ...state, isLoading: true, error: null })),
  on(ProjectActions.loadProjectsSuccess, (state, { items }) =>
    projectAdapter.setAll(items, {
      ...state,
      isLoading: false,
      error: null,
    })
  ),
  on(ProjectActions.deleteProjectFailure, (state, { error }) => ({ ...state, isLoading: false, error })),
  on(ProjectActions.loadProjectsFailure, (state, { error }) => ({ ...state, isLoading: false, error })),
  on(DeployActions.startDeploymentFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    isDeploymentArchivePreparing: false,
    error,
  })),
  on(ProjectActions.toggleExpandProjectWithChildren, (state, { updates }) =>
    projectAdapter.updateMany(updates, {
      ...state,
      isLoading: false,
      error: null,
    })
  ),
  on(ProjectActions.deleteProjectWithChildren, (state, { updates, idsToDelete }) => {
    const stateAfterUpdate = projectAdapter.updateMany(updates, {
      ...state,
      isLoading: false,
      error: null,
    });

    return projectAdapter.removeMany(idsToDelete, stateAfterUpdate);
  }),
  on(ProjectActions.selectProject, (state, { id }) => ({
    ...state,
    selectedProject: id,
    isLoading: false,
    error: null,
  })),
  on(ProjectActions.resetSelectedProject, (state) => ({ ...state, selectedProject: null })),
  on(ProjectActions.updateProjectParameters, (state, action) => {
    const { id } = action;
    const updatedProject = state.entities[id];
    const execInfo = {
      ...updatedProject.execInfo,
      ...(action.execInfo || {}),
    };
    const status = {
      ...updatedProject.status,
      ...(action.status || {}),
    };
    const update = {
      id,
      changes: {
        status,
        execInfo,
      },
    };
    return projectAdapter.updateOne(update, { ...state });
  }),
  on(DeployActions.startDeployment, (state, { config }) =>
    projectAdapter.updateOne(
      {
        id: config.projectId,
        changes: {
          status: ProjectStatus.createStatusByProgress(null),
        },
      },
      { ...state, isDeploymentArchivePreparing: true }
    )
  ),
  on(DeployActions.deploymentPackageDownloadSuccess, (state, { id }) => {
    const completedStatus = {
      name: ProjectStatusNames.READY,
      progress: 100,
    };
    const projectUpdate = {
      id,
      changes: {
        status: completedStatus,
      },
    };
    return projectAdapter.updateOne(projectUpdate, { ...state, isDeploymentArchivePreparing: false });
  }),
  on(Int8CalibrationActions.upsertInt8CalibrationPipeline, (state, { data }) => ({
    ...state,
    runningInt8CalibrationPipelines: int8CalibrationPipelineAdapter.upsertMany(
      data,
      state.runningInt8CalibrationPipelines
    ),
  })),
  on(Int8CalibrationActions.removeInt8CalibrationPipeline, (state, { data }) => ({
    ...state,
    runningInt8CalibrationPipelines: int8CalibrationPipelineAdapter.removeMany(
      data,
      state.runningInt8CalibrationPipelines
    ),
  })),
  on(ExportProjectReportActions.startExportProjectReport, (state) => ({ ...state, isReportGenerating: true })),
  on(ExportProjectReportActions.exportProjectReportSuccess, (state) => ({ ...state, isReportGenerating: false })),

  on(ExportProjectActions.startExportProject, (state) => ({ ...state, isExportRunning: true })),
  on(ExportProjectActions.startExportFailure, (state, { error }) => ({ ...state, isExportRunning: false, error })),
  on(ExportProjectActions.downloadProjectPackageFailure, (state, { error }) => ({
    ...state,
    isExportRunning: false,
    error,
  })),
  on(ExportProjectActions.downloadProjectPackageSuccess, (state) => ({ ...state, isExportRunning: false }))
);
