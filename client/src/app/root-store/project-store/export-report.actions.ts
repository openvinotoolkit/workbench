import { createAction, props } from '@ngrx/store';

import { ProjectStatus } from '@store/project-store/project.model';

export const startExportProjectReport = createAction('[Project] Start Export Project Report');
export const startExportProjectReportSuccess = createAction('[Project] Start Export Project Report Success');
export const startExportProjectReportFailure = createAction(
  '[Project] Start Export Project Report Failure',
  props<{ error }>()
);
export const exportProjectReportSuccess = createAction(
  '[Project] Export Project Report Success',
  props<{ modelId: number }>()
);
export const exportProjectReportFailure = createAction('[Project] Export Project Report Failure', props<{ error }>());
export const onExportProjectReportMessage = createAction(
  '[Project] Export Project Report Message',
  props<{ artifactId: number; projectId: number; tabId: string; status: ProjectStatus }>()
);
