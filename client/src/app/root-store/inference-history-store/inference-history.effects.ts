import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { Overlay } from '@angular/cdk/overlay';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, select, Store } from '@ngrx/store';
import { catchError, filter, map, mergeMap, switchMap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { endsWith, includes } from 'lodash';

import { InferenceRestService, RunInferenceResponseDTO } from '@core/services/api/rest/inference-rest.service';

import { selectSelectedInferenceResult } from '@store/inference-result-store/inference-result.selectors';
import * as Int8CalibrationActions from '@store/project-store/int8-calibration.actions';

import { RunningInferenceOverlayComponent } from '@shared/components/running-inference-overlay/running-inference-overlay.component';
import { JobType } from '@shared/models/pipelines/pipeline';

import * as InferenceHistoryActions from './inference-history.actions';
import { ICompoundInference } from './inference-history.model';
import {
  resetSelectedInferenceResult,
  setSelectedInferenceResult,
} from '../inference-result-store/inference-result.actions';
import { selectProjectItemsMap, selectSelectedProject } from '../project-store/project.selectors';
import { RootStoreState } from '../index';
import { loadProjectsForModel, selectProject, updateProjectParameters } from '../project-store/project.actions';
import {
  selectBestFilteredInferenceHistoryExecInfo,
  selectBestInferenceHistoryExecInfo,
  selectRunningInferenceOverlayId,
  selectRunningProfilingPipelines,
} from './inference-history.selectors';
import { ProjectStatusNames } from '../project-store/project.model';

@Injectable()
export class InferenceHistoryEffects {
  loadInferenceHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InferenceHistoryActions.loadInferenceHistory),
      filter(({ id }) => !!id),
      switchMap(({ id }) =>
        this.inferenceRestService.getInferenceResults$(id).pipe(
          map((items) => InferenceHistoryActions.loadInferenceHistorySuccess({ items })),
          catchError((error) => of(InferenceHistoryActions.loadInferenceHistoryFailure({ error })))
        )
      )
    )
  );

  updateProjectStatusOnLoadInferenceHistorySuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InferenceHistoryActions.loadInferenceHistorySuccess),
      withLatestFrom(
        this.store$.pipe(select(selectSelectedProject)),
        this.store$.pipe(select(selectBestInferenceHistoryExecInfo))
      ),
      filter(([_, project]) => !!project),
      map(([_, { id }, execInfo]) => updateProjectParameters({ id, execInfo }))
    )
  );

  resetInferenceResultOnFilterInferenceItemsOnGraph$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InferenceHistoryActions.filterInferenceItemsPoints),
      withLatestFrom(this.store$.select(selectSelectedInferenceResult)),
      filter(
        ([{ ids }, inferenceResultModel]) =>
          !inferenceResultModel || ids.includes(Number(inferenceResultModel.inferenceResultId))
      ),
      map(() => resetSelectedInferenceResult())
    )
  );

  addRunInferenceRequest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InferenceHistoryActions.addRunInferenceRequest),
      switchMap(({ config }) =>
        this.inferenceRestService.runInference$(config).pipe(
          map((data: RunInferenceResponseDTO) => {
            const { jobId, projectId, originalModelId } = data;
            if (!jobId) {
              return InferenceHistoryActions.addRunInferenceFailure({
                error: 'Invalid response on add new run inference request',
              });
            }
            if (includes(this.router.url, '/projects/create')) {
              this.router.navigate(['dashboard', originalModelId, 'projects', projectId]);
            }
            return InferenceHistoryActions.addRunInferenceSuccess({ projectId, originalModelId });
          }),
          catchError((error) => of(InferenceHistoryActions.addRunInferenceFailure({ error })))
        )
      )
    )
  );

  addRunInferenceSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InferenceHistoryActions.addRunInferenceSuccess),
      mergeMap(({ projectId, originalModelId }) => [
        loadProjectsForModel({ modelId: originalModelId }),
        InferenceHistoryActions.loadInferenceHistory({ id: projectId }),
        selectProject({ id: projectId }),
      ])
    )
  );

  updateInferenceHistoryAndProjectStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        InferenceHistoryActions.onProfilingSocketMessage,
        Int8CalibrationActions.onInt8CalibrationPipelineSocketMessage
      ),
      map((action) => action.message),
      withLatestFrom(this.store$.pipe(select(selectSelectedProject)), this.store$.pipe(select(selectProjectItemsMap))),
      filter(([pipeline, selectedProject, projectsMap]) => {
        const compoundInference = pipeline.jobs.find((j): j is ICompoundInference => j.type === JobType.profiling_job);
        const hasProject = !!projectsMap[compoundInference.projectId];
        const isSelected = !!selectedProject && compoundInference.originalModelId === selectedProject.originalModelId;

        return hasProject && isSelected;
      }),
      switchMap(([pipeline, selectedProject]) => {
        const compoundInference = pipeline.jobs.find((j): j is ICompoundInference => j.type === JobType.profiling_job);
        const { status } = pipeline;

        const actions: Action[] = [];

        if (status.name === ProjectStatusNames.READY) {
          actions.push(loadProjectsForModel({ modelId: compoundInference.originalModelId }));
        }

        const { inferences, projectId } = compoundInference;

        actions.push(
          InferenceHistoryActions.updateInferenceItemStatusAndPoints({
            items: selectedProject.id === compoundInference.projectId ? inferences : [],
            projectId,
            status,
          })
        );

        return actions;
      })
    )
  );

  trackRunningRemotePipelines$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InferenceHistoryActions.onProfilingSocketMessage),
      map((action) => action.message),
      map((pipeline) => {
        return [ProjectStatusNames.QUEUED, ProjectStatusNames.RUNNING].includes(pipeline.status.name)
          ? InferenceHistoryActions.upsertRunningProfiling({ data: [pipeline] })
          : InferenceHistoryActions.removeRunningProfiling({ id: pipeline.id });
      })
    )
  );

  openRunningProfilingOverlay$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InferenceHistoryActions.upsertRunningProfiling),
      map((action) => action.data),
      withLatestFrom(this.store$.select(selectRunningInferenceOverlayId)),
      filter(([items, overlayId]) => items.length && !overlayId),
      map(() => {
        const dialogRef = this.dialog.open(RunningInferenceOverlayComponent, {
          hasBackdrop: true,
          disableClose: true,
          scrollStrategy: this.overlay.scrollStrategies.block(),
          backdropClass: 'wb-dialog-backdrop',
          panelClass: 'wb-running-inference-overlay-panel',
        });

        return InferenceHistoryActions.setRunningInferenceOverlayId({ id: dialogRef.id });
      })
    )
  );

  closeRunningInferenceOverlay$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InferenceHistoryActions.removeRunningProfiling),
      withLatestFrom(
        this.store$.select(selectRunningInferenceOverlayId),
        this.store$.select(selectRunningProfilingPipelines)
      ),
      filter(([_, overlayId, pipelines]) => overlayId && !pipelines.length),
      map(([_, overlayId]) => {
        this.dialog.getDialogById(overlayId).close();
        return InferenceHistoryActions.setRunningInferenceOverlayId({ id: null });
      })
    )
  );

  updateInferenceItemStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InferenceHistoryActions.updateInferenceItemStatusAndPoints),
      withLatestFrom(
        this.store$.pipe(select(selectBestInferenceHistoryExecInfo)),
        this.store$.pipe(select(selectSelectedProject))
      ),
      map(([{ status, projectId }, historyExecInfo, selectedProject]) =>
        updateProjectParameters({
          id: projectId,
          status,
          execInfo:
            selectedProject?.id === projectId && selectedProject?.id === historyExecInfo?.projectId
              ? historyExecInfo
              : undefined,
        })
      )
    )
  );

  selectBaselinePoint$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        InferenceHistoryActions.updateInferenceItemStatusAndPoints,
        InferenceHistoryActions.loadInferenceHistorySuccess
      ),
      // Do not automatically select and load inference result for point on compare page
      filter(() => !endsWith(this.router.url, '/compare')),
      withLatestFrom(
        this.store$.pipe(select(selectSelectedProject)),
        this.store$.pipe(select(selectBestFilteredInferenceHistoryExecInfo))
      ),
      // Filter update inference socket messages for not selected projects
      filter(
        ([action, selectedProject]) =>
          action.type === InferenceHistoryActions.loadInferenceHistorySuccess.type ||
          action.projectId === selectedProject.id
      ),
      map(([, project, bestInference]) => {
        // Check loading inference results for not ready inferences
        if (!!project && !!bestInference) {
          const { id, profilingJobId } = bestInference;
          return setSelectedInferenceResult({
            jobId: profilingJobId,
            inferenceResultId: id,
          });
        } else {
          return resetSelectedInferenceResult();
        }
      })
    )
  );

  cancelInference$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InferenceHistoryActions.cancelInference),
      switchMap((payload) => {
        return this.inferenceRestService.cancelJob$(payload.jobId).pipe(
          map((response) => {
            const { jobId } = response;
            if (!jobId) {
              throw new Error(`Invalid response on cancel inference: ${response}`);
            }
            return InferenceHistoryActions.cancelInferenceSuccess({ jobId });
          }),
          catchError((error) => of(InferenceHistoryActions.cancelInferenceFailure({ error })))
        );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private router: Router,
    private inferenceRestService: InferenceRestService,
    private dialog: MatDialog,
    private overlay: Overlay
  ) {}
}
