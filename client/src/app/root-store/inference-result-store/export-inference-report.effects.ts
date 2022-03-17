import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { saveAs } from 'file-saver';

import { CommonRestService } from '@core/services/api/rest/common-rest.service';
import { InferenceRestService } from '@core/services/api/rest/inference-rest.service';

import * as GlobalsStoreSelectors from '@store/globals-store/globals.selectors';
import * as InferenceResultStoreSelectors from '@store/inference-result-store/inference-result.selectors';
import * as ExportInferenceReportActions from '@store/inference-result-store/export-inference-report.actions';
import { RootStoreState } from '@store';
import { InferenceResultModel } from '@store/inference-result-store/inference-result.model';
import { ProjectItem, ProjectStatusNames } from '@store/project-store/project.model';
import * as ProjectStoreSelectors from '@store/project-store/project.selectors';

@Injectable()
export class ExportInferenceReportEffects {
  exportInferenceReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ExportInferenceReportActions.startExportInferenceResultReport),
      withLatestFrom(
        this.store$.select<InferenceResultModel>(InferenceResultStoreSelectors.selectSelectedInferenceResult),
        this.store$.select<string>(GlobalsStoreSelectors.selectTabId)
      ),
      switchMap(([_, selectedInferenceResult, tabId]) =>
        this.inferenceRestService.getInferenceReport$(selectedInferenceResult.inferenceResultId, tabId).pipe(
          map(() => ExportInferenceReportActions.startExportInferenceResultReportSuccess()),
          catchError((error) => of(ExportInferenceReportActions.startExportInferenceResultReportFailure({ error })))
        )
      )
    )
  );

  exportInferenceReportMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ExportInferenceReportActions.onExportInferenceResultReportMessage),
      withLatestFrom(this.store$.select<string>(GlobalsStoreSelectors.selectTabId)),
      filter(
        ([{ artifactId, tabId, status, inferenceId }, currentTabId]) =>
          tabId === currentTabId && status.name === ProjectStatusNames.READY
      ),
      withLatestFrom(
        this.store$.select<InferenceResultModel>(InferenceResultStoreSelectors.selectSelectedInferenceResult),
        this.store$.select<ProjectItem>(ProjectStoreSelectors.selectSelectedProject)
      ),
      switchMap(([[{ artifactId }], { execInfo }, { modelName, datasetName, deviceName, modelId }]) => {
        const path = `${artifactId}.csv`;
        const { batch, nireq } = execInfo;
        const name = `${modelName}_${datasetName}_${deviceName}_stream_${nireq}_batch_${batch}_report.csv`;
        return this.commonRestService.downloadFile$(path).pipe(
          map((res) => {
            saveAs(res.body, name);
            return ExportInferenceReportActions.exportInferenceResultReportSuccess({ modelId });
          }),
          catchError((error) => of(ExportInferenceReportActions.exportInferenceResultReportFailure({ error })))
        );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private commonRestService: CommonRestService,
    private inferenceRestService: InferenceRestService
  ) {}
}
