import { createAction, props } from '@ngrx/store';

import { ErrorState } from '@store/state';
import { IAccuracyPipeline } from '@store/accuracy-analysis-store/accuracy-analysis-store.models';

import { AccuracyReportType, IAccuracyReport } from '@shared/models/accuracy-analysis/accuracy-report';

const actionTypePrefix = '[Accuracy Analysis]';

export const createAccuracyReport = createAction(
  `${actionTypePrefix} Create Accuracy Report`,
  props<{ projectId: number; reportType: AccuracyReportType }>()
);

export const createAccuracyReportSuccess = createAction(`${actionTypePrefix} Create Accuracy Report Success`);

export const createAccuracyReportFailure = createAction(
  `${actionTypePrefix} Create Accuracy Report Failure`,
  props<{ error: ErrorState; reportType: AccuracyReportType }>()
);

export const loadAccuracyReports = createAction(
  `${actionTypePrefix} Load Accuracy Reports`,
  props<{ projectId: number }>()
);

export const loadAccuracyReportsSuccess = createAction(
  `${actionTypePrefix} Load Accuracy Reports Success`,
  props<{ reports: IAccuracyReport[] }>()
);

export const loadAccuracyReportsFailure = createAction(
  `${actionTypePrefix} Load Accuracy Reports Failure`,
  props<{ error: ErrorState }>()
);

export const resetAccuracyReports = createAction(`${actionTypePrefix} Reset Accuracy Reports`);

export const upsertAccuracyPipeline = createAction(
  `${actionTypePrefix} Upsert Accuracy Pipeline`,
  props<{ data: IAccuracyPipeline[] }>()
);

export const removeAccuracyPipeline = createAction(
  `${actionTypePrefix} Remove Accuracy Pipeline`,
  props<{ id: number }>()
);
