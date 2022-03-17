import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { mergeMap, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { Store } from '@ngrx/store';

import { Categories, GAActions, GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import * as DeployActions from '@store/project-store/deployment.actions';
import * as ExportProjectActions from '@store/project-store/export-project.actions';
import * as ExportReportActions from '@store/project-store/export-report.actions';
import { modelDomainNames, ModelItem, TaskMethodToNameMap } from '@store/model-store/model.model';
import * as ModelStoreSelectors from '@store/model-store/model.selectors';
import { RootStoreState } from '@store';
import * as ModelCalibrationActions from '@store/project-store/model-tuning.actions';
import * as ProjectActions from '@store/project-store/project.actions';
import { ProjectItem, ProjectStatusNames } from '@store/project-store/project.model';
import * as DatasetStoreSelectors from '@store/dataset-store/dataset.selectors';
import * as ProjectStoreSelectors from '@store/project-store/project.selectors';
import * as TargetMachineSelectors from '@store/target-machine-store/target-machine.selectors';

import { TargetMachineItem } from '@shared/models/pipelines/target-machines/target-machine';

@Injectable()
export class ProjectGAEffects {
  startDeployGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DeployActions.startDeployment),
        tap(({ config }) => {
          this.gAnalyticsService.emitDeployEvent(config);
        })
      ),
    { dispatch: false }
  );
  DeployErrorGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DeployActions.startDeploymentFailure),
        tap(({ error }) => {
          this.gAnalyticsService.emitErrorEvent(GAActions.PACKAGE, error as string);
        })
      ),
    { dispatch: false }
  );

  startProjectExportGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ExportProjectActions.startExportProject),
        tap(({ config }) => {
          this.gAnalyticsService.emitExportProjectEvent(config);
        })
      ),
    { dispatch: false }
  );

  exportProjectErrorGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ExportProjectActions.startExportFailure),
        tap(({ error }) => {
          this.gAnalyticsService.emitErrorEvent(GAActions.EXPORT_PROJECT, error as string);
        })
      ),
    { dispatch: false }
  );

  reportExportGAError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ExportReportActions.exportProjectReportFailure),
        tap(({ error }) => {
          this.gAnalyticsService.emitErrorEvent(GAActions.PACKAGE, error);
        })
      ),
    { dispatch: false }
  );

  reportExportGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ExportReportActions.exportProjectReportSuccess),
        mergeMap((payload) =>
          of(payload).pipe(
            withLatestFrom(this.store$.select<ModelItem>(ModelStoreSelectors.selectModelById, payload.modelId))
          )
        ),
        tap(([_, model]) => {
          const modelType = TaskMethodToNameMap[model.accuracyConfiguration.taskMethod];
          const modelDomain = modelDomainNames[model.domain];
          this.gAnalyticsService.emitEvent(GAActions.EXPORT, Categories.EXPORT_REPORT, {
            reportType: 'Project',
            modelType,
            modelDomain,
          });
        })
      ),
    { dispatch: false }
  );

  reportTuningGAError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ModelCalibrationActions.modelCalibrationStartFailure),
        tap(({ error }) => this.gAnalyticsService.emitErrorEvent(GAActions.INT8, error as string))
      ),
    { dispatch: false }
  );

  reportAccuracyGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ProjectActions.reportAccuracyGA),
        switchMap((payload) =>
          of(payload).pipe(
            withLatestFrom(this.store$.select(ProjectStoreSelectors.selectProjectById, payload.projectId))
          )
        ),
        switchMap(([payload, project]) =>
          of(payload).pipe(
            withLatestFrom(
              this.store$.select(ModelStoreSelectors.selectModelById, project.originalModelId),
              this.store$.select(DatasetStoreSelectors.selectDatasetById, project.datasetId),
              this.store$.select(ProjectStoreSelectors.selectProjectById, project.id),
              this.store$.select(ProjectStoreSelectors.selectProjectById, project.parentId)
            )
          )
        ),
        tap(([{ status, accuracyReportType }, originalModel, dataset, project, parentProject]) => {
          const accuracyEventMetadata = {
            originalModel,
            dataset,
            project,
            parentProject,
          };
          if (status === ProjectStatusNames.ERROR) {
            this.gAnalyticsService.emitAccuracyReportErrorEvent(accuracyReportType, accuracyEventMetadata);
            return;
          }
          if (status === ProjectStatusNames.READY) {
            this.gAnalyticsService.emitAccuracyReportCreatedEvent(accuracyReportType, accuracyEventMetadata);
            return;
          }
          if (status === ProjectStatusNames.QUEUED) {
            this.gAnalyticsService.emitTriggerAccuracyReportEvent(accuracyReportType, accuracyEventMetadata);
            return;
          }
        })
      ),
    { dispatch: false }
  );

  reportComparisonGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ProjectActions.reportComparisonGA),
        switchMap((payload) =>
          of(payload).pipe(
            withLatestFrom(
              this.store$.select<ModelItem>(ModelStoreSelectors.selectModelById, payload.modelId.toString()),
              this.store$.select<ProjectItem>(ProjectStoreSelectors.selectProjectById, payload.projectA),
              this.store$.select<ProjectItem>(ProjectStoreSelectors.selectProjectById, payload.projectB)
            )
          )
        ),
        switchMap(([_, model, projectA, projectB]) =>
          of([model, projectA, projectB]).pipe(
            withLatestFrom(
              this.store$.select<TargetMachineItem>(TargetMachineSelectors.selectTargetMachineById, projectA.targetId),
              this.store$.select<TargetMachineItem>(TargetMachineSelectors.selectTargetMachineById, projectB.targetId)
            )
          )
        ),
        tap(([[model, projectA, projectB], targetA, targetB]) => {
          this.gAnalyticsService.emitComparisonEvent(
            targetA,
            targetB,
            model as ModelItem,
            projectA as ProjectItem,
            projectB as ProjectItem
          );
        })
      ),
    { dispatch: false }
  );

  reportOptimizationGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ProjectActions.reportOptimizationGA),
        switchMap((payload) =>
          of(payload).pipe(
            withLatestFrom(
              this.store$.select(ProjectStoreSelectors.selectProjectById, payload.projectId),
              this.store$.select(TargetMachineSelectors.selectTargetMachineById, payload.targetId),
              this.store$.select(ModelStoreSelectors.selectModelById, payload.originalModelId),
              this.store$.select(DatasetStoreSelectors.selectDatasetById, payload.datasetId)
            )
          )
        ),
        tap(([_, project, target, model, dataset]) => {
          this.gAnalyticsService.emitOptimizationEvent(project, target, model, dataset);
        })
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private gAnalyticsService: GoogleAnalyticsService,
    private store$: Store<RootStoreState.State>
  ) {}
}
