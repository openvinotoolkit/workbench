import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { of } from 'rxjs';
import { Dictionary } from '@ngrx/entity';
import { isEmpty, map as _map, pickBy } from 'lodash';

import { TargetMachineService } from '@core/services/api/rest/target-machine.service';

import { RootStoreState } from '@store';
import * as PipelineActions from '@store/pipelines-store/pipelines.actions';
import * as GlobalsStoreActions from '@store/globals-store/globals.actions';
import * as GlobalsStoreSelectors from '@store/globals-store/globals.selectors';

import { TargetMachineItem, TargetMachineStatusNames } from '@shared/models/pipelines/target-machines/target-machine';

import * as TargetMachineActions from './target-machine.actions';
import * as TargetMachineSelectors from './target-machine.selectors';

@Injectable()
export class TargetMachineEffects {
  loadTargetMachineList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TargetMachineActions.loadTargetMachines),
      switchMap(() =>
        this.targetMachineService.getTargetMachinesList$().pipe(
          map((targetMachines) => TargetMachineActions.loadTargetMachinesSuccess({ targetMachines })),
          catchError((error) => of(TargetMachineActions.loadTargetMachinesFailure({ error })))
        )
      )
    )
  );

  setDevCloudNotAvailableForInactiveMachines$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TargetMachineActions.loadTargetMachinesSuccess),
      map(({ targetMachines }) => targetMachines),
      withLatestFrom(this.store$.pipe(select(GlobalsStoreSelectors.selectIsDevCloudMode))),
      filter(
        ([targetMachines, isDevCloudMode]: [TargetMachineItem[], boolean]) =>
          isDevCloudMode &&
          targetMachines.every(
            ({ lastConnectionStatus }) => lastConnectionStatus === TargetMachineStatusNames.NOT_CONFIGURED
          )
      ),
      map(([, isDevCloudMode]) =>
        GlobalsStoreActions.setDevCloudMetadataAction({
          devCloudMetadata: {
            isDevCloudMode,
            isDevCloudAvailable: false,
          },
        })
      )
    )
  );

  loadTargetMachine$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TargetMachineActions.loadTargetMachine),
      switchMap(({ targetId }) =>
        this.targetMachineService.getTargetMachine$(targetId).pipe(
          map((targetMachine) => TargetMachineActions.loadTargetMachineSuccess({ targetMachine })),
          catchError((error) => of(TargetMachineActions.loadTargetMachineFailure({ error })))
        )
      )
    )
  );

  addTargetMachines$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TargetMachineActions.addTargetMachine),
      switchMap(({ targetMachine }) =>
        this.targetMachineService.addTargetMachine$(targetMachine).pipe(
          map((newTargetMachine) => TargetMachineActions.addTargetMachineSuccess({ targetMachine: newTargetMachine })),
          catchError(({ error, targetId }) => of(TargetMachineActions.addTargetMachineFailure({ error, targetId })))
        )
      )
    )
  );

  goToTargetMachinesPageAfterAddOrEdit$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<{ type: string; targetMachine?: TargetMachineItem; targetId?: number }>(
          TargetMachineActions.addTargetMachineSuccess,
          TargetMachineActions.editTargetMachineSuccess,
          TargetMachineActions.addTargetMachineFailure,
          TargetMachineActions.editTargetMachineFailure
        ),
        tap(({ targetMachine, targetId }) => {
          if (!targetMachine && !targetId) {
            return;
          }
          this.router.navigate(['/target-machines'], {
            queryParams: { targetId: targetMachine?.targetId || targetId },
          });
        })
      ),
    { dispatch: false }
  );

  editTargetMachines$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TargetMachineActions.editTargetMachine),
      switchMap(({ targetMachine }) =>
        this.targetMachineService.editTargetMachine$(targetMachine).pipe(
          map((newTargetMachine) => TargetMachineActions.editTargetMachineSuccess({ targetMachine: newTargetMachine })),
          catchError(({ error, targetId }) => of(TargetMachineActions.editTargetMachineFailure({ error, targetId })))
        )
      )
    )
  );

  removeTargetMachines$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TargetMachineActions.removeTargetMachine),
      switchMap(({ targetMachineId }) =>
        this.targetMachineService.removeTargetMachine$(targetMachineId).pipe(
          map(({ targetId }) => TargetMachineActions.removeTargetMachineSuccess({ targetId })),
          catchError((error) => of(TargetMachineActions.removeTargetMachineFailure({ error })))
        )
      )
    )
  );

  pingTargetMachine$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TargetMachineActions.pingTargetMachine),
      switchMap(({ targetId }) =>
        this.targetMachineService.pingTargetMachine$(targetId).pipe(
          map((targetMachine) => TargetMachineActions.pingTargetMachineSuccess({ targetMachine })),
          catchError((error) => of(TargetMachineActions.pingTargetMachineFailure({ error })))
        )
      )
    )
  );

  updateTargetMachineStatusOnPipelineUpdate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PipelineActions.updatePipelines),
      withLatestFrom(this.store$.pipe(select(TargetMachineSelectors.selectTargetMachineStatusesMap))),
      map(([{ pipelines }, targetMachineStatusesMap]) => {
        // Get array of target machine statuses to update
        const targetMachineStatusesMapFromPipelines = pipelines.reduce((acc, { targetId, targetStatus }) => {
          acc[targetId] = targetStatus;
          return acc;
        }, {} as Dictionary<TargetMachineStatusNames>);
        const changedTargetStatusesMap: Dictionary<TargetMachineStatusNames> = pickBy(
          targetMachineStatusesMapFromPipelines,
          (targetStatusFromPipeline, targetId) => targetStatusFromPipeline !== targetMachineStatusesMap[targetId]
        );
        return changedTargetStatusesMap;
      }),
      filter((changedTargetStatusesMap) => !isEmpty(changedTargetStatusesMap)),
      switchMap((changedTargetStatusesMap) => {
        // Dispatch actions to update for all target machine statuses
        return _map(changedTargetStatusesMap, (status, targetId) =>
          TargetMachineActions.updateTargetMachineStatus({ targetId: Number(targetId), status })
        );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    public router: Router,
    private targetMachineService: TargetMachineService
  ) {}
}
