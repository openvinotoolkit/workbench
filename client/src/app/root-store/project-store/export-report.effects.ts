import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { saveAs } from 'file-saver';

import { CommonRestService } from '@core/services/api/rest/common-rest.service';
import { ProjectsRestService } from '@core/services/api/rest/projects-rest.service';

import * as GlobalsStoreSelectors from '@store/globals-store/globals.selectors';
import * as ExportReportActions from '@store/project-store/export-report.actions';
import { RootStoreState } from '@store';
import * as ProjectStoreSelectors from '@store/project-store/project.selectors';
import { ProjectItem, ProjectStatusNames } from '@store/project-store/project.model';

@Injectable()
export class ExportReportEffects {
  exportProjectReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ExportReportActions.startExportProjectReport),
      withLatestFrom(
        this.store$.select<ProjectItem>(ProjectStoreSelectors.selectSelectedProject),
        this.store$.select<string>(GlobalsStoreSelectors.selectTabId)
      ),
      switchMap(([_, selectedProject, tabId]) =>
        this.projectsRestService.getProjectReport$(selectedProject.id, tabId).pipe(
          map(() => ExportReportActions.startExportProjectReportSuccess()),
          catchError((error) => of(ExportReportActions.exportProjectReportFailure({ error })))
        )
      )
    )
  );

  exportProjectReportMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ExportReportActions.onExportProjectReportMessage),
      withLatestFrom(this.store$.select<string>(GlobalsStoreSelectors.selectTabId)),
      filter(
        ([{ artifactId, tabId, status, projectId }, currentTabId]) =>
          tabId === currentTabId && status.name === ProjectStatusNames.READY
      ),
      withLatestFrom(this.store$.select<ProjectItem>(ProjectStoreSelectors.selectSelectedProject)),
      switchMap(([[{ artifactId }], { modelName, datasetName, deviceName, modelId }]) => {
        const path = `${artifactId}.csv`;
        const name = `${modelName}_${datasetName}_${deviceName}_report.csv`;
        return this.commonRestService.downloadFile$(path).pipe(
          map((res) => {
            saveAs(res.body, name);
            return ExportReportActions.exportProjectReportSuccess({ modelId });
          }),
          catchError((error) => of(ExportReportActions.exportProjectReportFailure({ error })))
        );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private commonRestService: CommonRestService,
    private projectsRestService: ProjectsRestService
  ) {}
}
