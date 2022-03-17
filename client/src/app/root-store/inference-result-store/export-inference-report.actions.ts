import { createAction, props } from '@ngrx/store';

import { ProjectStatus } from '@store/project-store/project.model';

export const startExportInferenceResultReport = createAction('[Inference Result] Start Export Inference Result Report');
export const startExportInferenceResultReportSuccess = createAction(
  '[Inference Result] Start Export Inference Result Report Success'
);
export const startExportInferenceResultReportFailure = createAction(
  '[Inference Result] Start Export Inference Result Report Failure',
  props<{ error }>()
);
export const exportInferenceResultReportSuccess = createAction(
  '[Inference Result] Export Inference Result Report Success',
  props<{ modelId: number }>()
);
export const exportInferenceResultReportFailure = createAction(
  '[Inference Result] Export Inference Result Report Failure',
  props<{ error }>()
);
export const onExportInferenceResultReportMessage = createAction(
  '[Inference Result] Export Inference Result Report Message',
  props<{ artifactId: number; inferenceId: number; tabId: string; status: ProjectStatus }>()
);
