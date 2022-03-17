import { Injectable } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { MatDialog } from '@angular/material/dialog';

import { filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { TypedAction } from '@ngrx/store/src/models';

import { ProjectItem, ProjectStatusNames } from '@store/project-store/project.model';
import { setRunningInferenceOverlayId } from '@store/inference-history-store/inference-history.actions';
import { selectRunningInferenceOverlayId } from '@store/inference-history-store/inference-history.selectors';
import { reportOptimizationGA } from '@store/project-store/project.actions';
import { ICompoundInference } from '@store/inference-history-store/inference-history.model';
import * as ProjectStoreSelectors from '@store/project-store/project.selectors';
import { refreshSelectedModel } from '@store/model-store/model.actions';

import { RunningInferenceOverlayComponent } from '@shared/components/running-inference-overlay/running-inference-overlay.component';
import { IInt8CalibrationPipeline } from '@shared/models/pipelines/int8-calibration-pipeline';
import { JobType, PipelineStage } from '@shared/models/pipelines/pipeline';

import { RootStoreState } from '../index';
import * as Int8CalibrationActions from './int8-calibration.actions';
import * as ProjectSelectors from './project.selectors';

@Injectable()
export class Int8CalibrationEffects {
  trackRunningInt8CalibrationPipelines$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Int8CalibrationActions.onInt8CalibrationPipelineSocketMessage),
      map(({ message }) => message),
      map((pipeline) =>
        [ProjectStatusNames.QUEUED, ProjectStatusNames.RUNNING].includes(pipeline.status.name)
          ? Int8CalibrationActions.upsertInt8CalibrationPipeline({ data: [pipeline] })
          : Int8CalibrationActions.removeInt8CalibrationPipeline({ data: [pipeline.id] })
      )
    )
  );

  openRunningInferenceOverlay$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Int8CalibrationActions.upsertInt8CalibrationPipeline),
      map((action) => action.data),
      withLatestFrom(this.store$.select(selectRunningInferenceOverlayId)),
      filter(([items, overlayId]) => items.length && !overlayId),
      filter(([items]) =>
        items
          .map((item) => item.status.stage)
          .some((stage) => [PipelineStage.PREPARING_PROFILING_ASSETS, PipelineStage.PROFILING].includes(stage))
      ),
      map(() => {
        const dialogRef = this.dialog.open(RunningInferenceOverlayComponent, {
          hasBackdrop: true,
          disableClose: true,
          scrollStrategy: this.overlay.scrollStrategies.block(),
          backdropClass: 'wb-dialog-backdrop',
          panelClass: 'wb-running-inference-overlay-panel',
        });

        return setRunningInferenceOverlayId({ id: dialogRef.id });
      })
    )
  );

  closeRunningInferenceOverlay$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Int8CalibrationActions.removeInt8CalibrationPipeline),
      withLatestFrom(
        this.store$.select(selectRunningInferenceOverlayId),
        this.store$.select(ProjectSelectors.selectRunningInt8CalibrationPipelines)
      ),
      filter(([action, overlayId, pipelines]) => !pipelines.length),
      switchMap(([action, overlayId]) => {
        const actions: TypedAction<string>[] = [refreshSelectedModel()];

        if (overlayId) {
          this.dialog.getDialogById(overlayId).close();
          actions.push(setRunningInferenceOverlayId({ id: null }));
        }

        return actions;
      })
    )
  );

  reportInt8CalibrationToGA$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Int8CalibrationActions.onInt8CalibrationPipelineSocketMessage),
      map(({ message }) => message),
      filter(
        ({ status, jobs }: IInt8CalibrationPipeline) => status.name === ProjectStatusNames.READY && Boolean(jobs.length)
      ),
      map(
        ({ jobs }: IInt8CalibrationPipeline) =>
          (jobs.find((j) => j.type === JobType.profiling_job) as ICompoundInference).projectId
      ),
      switchMap((projectId) =>
        of(projectId).pipe(withLatestFrom(this.store$.select(ProjectStoreSelectors.selectProjectById, projectId)))
      ),
      filter(([_, project]) => !!project),
      map(([projectId, project]: [number, ProjectItem]) => {
        const { targetId, originalModelId, datasetId } = project;
        return reportOptimizationGA({
          projectId,
          targetId,
          originalModelId,
          datasetId,
        });
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private dialog: MatDialog,
    private overlay: Overlay
  ) {}
}
