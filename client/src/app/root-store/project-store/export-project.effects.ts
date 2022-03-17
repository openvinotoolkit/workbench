import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { saveAs } from 'file-saver';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { select, Store } from '@ngrx/store';
import { Dictionary } from '@ngrx/entity';

import { ExportProjectRestService } from '@core/services/api/rest/export-project-rest.service';
import { CommonRestService } from '@core/services/api/rest/common-rest.service';

import * as ExportProjectActions from '@store/project-store/export-project.actions';
import * as GlobalsStoreSelectors from '@store/globals-store/globals.selectors';
import { ExportProjectPipelineSocketDTO, ProjectItem, ProjectStatusNames } from '@store/project-store/project.model';
import { RootStoreState } from '@store/index';
import { loadProjectsForModel, selectProject, updateProjectParameters } from '@store/project-store/project.actions';
import { selectProjectItemsMap, selectSelectedProject } from '@store/project-store/project.selectors';

@Injectable()
export class ExportProjectEffects {
  startExportProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ExportProjectActions.startExportProject),
      withLatestFrom(this.store$.select<string>(GlobalsStoreSelectors.selectTabId)),
      switchMap(([{ projectId, config }, tabId]) => {
        return this.exportProjectRestService.startExportProject$(projectId, config, tabId).pipe(
          map(() => ExportProjectActions.startExportSuccess()),
          catchError((error) => of(ExportProjectActions.startExportFailure({ error })))
        );
      })
    )
  );

  exportProjectSocket$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ExportProjectActions.onExportSocketMessage),
      map((action) => action.message),
      withLatestFrom(
        this.store$.pipe(select(selectProjectItemsMap)),
        this.store$.pipe(select(selectSelectedProject)),
        this.store$.pipe(select(GlobalsStoreSelectors.selectTabId)),
        (message, projectItemsMap, selectedProject, socketTabId) =>
          [message, projectItemsMap, selectedProject, socketTabId] as [
            ExportProjectPipelineSocketDTO,
            Dictionary<ProjectItem>,
            ProjectItem,
            string
          ]
      ),
      switchMap(([message, projectItemsMap, selectedProject]) => {
        const { status } = message;
        const [exportJob] = message.jobs;
        const { artifactId, projectName, projectId } = exportJob;
        const exportProject = projectItemsMap[projectId];
        if (!exportProject) {
          return [loadProjectsForModel({ modelId: selectedProject.originalModelId }), selectProject({ id: projectId })];
        }
        if (status.name === ProjectStatusNames.READY) {
          return [
            ExportProjectActions.downloadProjectPackage({ projectId, artifactId, projectName }),
            updateProjectParameters({ id: projectId, status }),
          ];
        }
        return [updateProjectParameters({ id: projectId, status })];
      })
    )
  );

  exportProjectPackage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ExportProjectActions.downloadProjectPackage),
      switchMap(({ projectId, artifactId, projectName }) => {
        const name = `${projectName}.tar.gz`;
        const path = `${artifactId}.tar.gz`;
        return this.commonRestService.downloadFile$(path).pipe(
          map((res) => {
            saveAs(res.body, name);
            return ExportProjectActions.downloadProjectPackageSuccess({ projectId });
          }),
          catchError((error) => of(ExportProjectActions.downloadProjectPackageFailure({ error })))
        );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private exportProjectRestService: ExportProjectRestService,
    private commonRestService: CommonRestService,
    private store$: Store<RootStoreState.State>
  ) {}
}
