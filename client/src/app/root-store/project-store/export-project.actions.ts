import { createAction, props } from '@ngrx/store';

import { ExportProjectConfig, ExportProjectPipelineSocketDTO } from '@store/project-store/project.model';
import { ErrorState } from '@store/state';

export const startExportProject = createAction(
  '[Export Project] Start Export',
  props<{ projectId: number; config: ExportProjectConfig }>()
);
export const startExportSuccess = createAction('[Export Project] Start Export Success');

export const startExportFailure = createAction('[Export Project] Start Export Failure', props<{ error: ErrorState }>());

export const onExportSocketMessage = createAction(
  '[Export Project] On Export Socket Message',
  props<{ message: ExportProjectPipelineSocketDTO }>()
);

export const downloadProjectPackage = createAction(
  '[Export Project] Download Project Package',
  props<{ projectId: number; artifactId: number; projectName: string }>()
);

export const downloadProjectPackageSuccess = createAction(
  '[Export Project] Download Project Package Success',
  props<{ projectId: number }>()
);

export const downloadProjectPackageFailure = createAction(
  '[Export Project] Download Project Package Failure',
  props<{ error: ErrorState }>()
);
