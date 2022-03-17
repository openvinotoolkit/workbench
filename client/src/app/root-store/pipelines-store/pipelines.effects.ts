import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { TargetMachineService } from '@core/services/api/rest/target-machine.service';

import { RootStoreState } from '@store';
import * as TargetMachineSelectors from '@store/target-machine-store/target-machine.selectors';
import * as TargetMachineActions from '@store/target-machine-store/target-machine.actions';

import { PipelineStageStatusNames } from '@shared/models/pipelines/target-machines/configure-target-pipeline';

import * as PipelineActions from './pipelines.actions';

@Injectable()
export class PipelinesEffects {
  loadPipelinesForTargetMachine$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PipelineActions.loadPipelineForTargetMachine),
      switchMap(({ targetMachineId }) =>
        this.targetMachineService.getPipelinesListForTargetMachine$(targetMachineId).pipe(
          map((pipelines) => PipelineActions.loadPipelineForTargetMachineSuccess({ pipelines })),
          catchError((error) => of(PipelineActions.loadPipelineForTargetMachineFailure({ error })))
        )
      )
    )
  );

  updatePipelinesOnConfigureTargetSocketMessages$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PipelineActions.onSetupTargetPipelineSocketMessage, PipelineActions.onPingTargetPipelineSocketMessage),
      map(({ message: pipelines }) => PipelineActions.updatePipelines({ pipelines }))
    )
  );

  reloadTargetMachineOnPipelineSuccessOrFail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PipelineActions.onSetupTargetPipelineSocketMessage, PipelineActions.onPingTargetPipelineSocketMessage),
      filter(
        ({ message: pipelines }) =>
          pipelines.every(
            (stage) =>
              stage.status.name === PipelineStageStatusNames.SUCCESS ||
              stage.status.name === PipelineStageStatusNames.WARNING
          ) || pipelines.some((stage) => stage.status.name === PipelineStageStatusNames.FAILURE)
      ),
      withLatestFrom(this.store$.select<number>(TargetMachineSelectors.selectSelectedTargetMachineId)),
      map(([, targetId]) => TargetMachineActions.loadTargetMachine({ targetId }))
    )
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private targetMachineService: TargetMachineService
  ) {}
}
