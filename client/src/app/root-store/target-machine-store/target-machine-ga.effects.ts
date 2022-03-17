import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { filter, mergeMap, tap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';

import { Categories, GAActions, GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import * as TargetMachineActions from '@store/target-machine-store/target-machine.actions';
import * as TargetMachineSelectors from '@store/target-machine-store/target-machine.selectors';
import { RootStoreState } from '@store';

import { TargetMachineItem, TargetMachineStatusNames } from '@shared/models/pipelines/target-machines/target-machine';
import { DeviceItem } from '@shared/models/device';

@Injectable()
export class TargetMachineGAEffects {
  targetMachineReportSuccessGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(TargetMachineActions.updateTargetMachineStatus),
        filter(({ status }) => status === TargetMachineStatusNames.AVAILABLE),
        mergeMap((payload) =>
          of(payload).pipe(
            withLatestFrom(
              this.store$.select<TargetMachineItem>(TargetMachineSelectors.selectTargetMachineById, payload.targetId)
            )
          )
        ),
        tap(([_, target]) => {
          const devices = target.devices?.map((device: DeviceItem) => device.deviceName).join(' ');
          const rootUser = target.username === 'root';
          this.googleAnalyticsService.emitEvent(GAActions.SETUP, Categories.REMOTE_MACHINE, { devices, rootUser });
        })
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private googleAnalyticsService: GoogleAnalyticsService
  ) {}
}
