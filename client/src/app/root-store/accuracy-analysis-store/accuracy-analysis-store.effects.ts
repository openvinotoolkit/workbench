import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, concatMap, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { Action, select, Store } from '@ngrx/store';
import { of } from 'rxjs';

import { AccuracyRestService } from '@core/services/api/rest/accuracy.service';

import { ProjectStoreActions, ProjectStoreSelectors, RootStoreState } from '@store';
import * as ProjectActions from '@store/project-store/project.actions';
import { ProjectStatusNames } from '@store/project-store/project.model';

import * as AccuracyAnalysisStoreActions from './accuracy-analysis-store.actions';
import { PIPELINE_TYPE_TO_REPORT_TYPE_MAP } from '../../modules/dashboard/components/analyze-accuracy-ribbon-content/analyze-accuracy-ribbon-content.component';

@Injectable()
export class AccuracyAnalysisEffects {
  createAccuracyReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AccuracyAnalysisStoreActions.createAccuracyReport),
      switchMap(({ projectId, reportType }) =>
        this.accuracyRestService.createAccuracyReport$(projectId, reportType).pipe(
          map((response) => AccuracyAnalysisStoreActions.createAccuracyReportSuccess()),
          catchError((error) => of(AccuracyAnalysisStoreActions.createAccuracyReportFailure({ error, reportType })))
        )
      )
    )
  );

  reportCreateAccuracyReportToGA$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AccuracyAnalysisStoreActions.createAccuracyReport),
      map(({ projectId, reportType }) =>
        ProjectStoreActions.reportAccuracyGA({
          projectId,
          accuracyReportType: reportType,
          status: ProjectStatusNames.QUEUED,
        })
      )
    )
  );

  createAccuracyReportFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AccuracyAnalysisStoreActions.createAccuracyReportFailure),
      withLatestFrom(this.store$.pipe(select(ProjectStoreSelectors.selectSelectedProject))),
      switchMap(([{ error, reportType }, { id }]) => [
        ProjectStoreActions.updateProjectParameters({
          id,
          status: { name: ProjectStatusNames.ERROR, errorMessage: <string>error },
        }),
        ProjectStoreActions.reportAccuracyGA({
          projectId: id,
          accuracyReportType: reportType,
          status: ProjectStatusNames.ERROR,
        }),
      ])
    )
  );

  loadAccuracyReports$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AccuracyAnalysisStoreActions.loadAccuracyReports),
      switchMap(({ projectId }) =>
        this.accuracyRestService.getReports$(projectId).pipe(
          map((reports) => AccuracyAnalysisStoreActions.loadAccuracyReportsSuccess({ reports })),
          catchError((error) => of(AccuracyAnalysisStoreActions.loadAccuracyReportsFailure({ error })))
        )
      )
    )
  );

  updateAccuracyPipelineOnAccuracySocketMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectActions.onAccuracySocketMessage),
      concatMap(({ message }) => {
        const pipelineStatusName = message.status.name;
        const actions: Action[] = [AccuracyAnalysisStoreActions.upsertAccuracyPipeline({ data: [message] })];
        if (![ProjectStatusNames.QUEUED, ProjectStatusNames.RUNNING].includes(pipelineStatusName)) {
          actions.push(AccuracyAnalysisStoreActions.removeAccuracyPipeline({ id: message.id }));
          // Report GA action for success or failed accuracy report creation
          if (pipelineStatusName === ProjectStatusNames.READY || pipelineStatusName === ProjectStatusNames.ERROR) {
            const accuracyReportType = PIPELINE_TYPE_TO_REPORT_TYPE_MAP[message.type];
            actions.push(
              ProjectStoreActions.reportAccuracyGA({
                projectId: message.projectId,
                accuracyReportType,
                status: pipelineStatusName,
              })
            );
          }
        }

        return actions;
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private accuracyRestService: AccuracyRestService
  ) {}
}
