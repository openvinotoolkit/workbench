import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, tap } from 'rxjs/operators';
import { filter as _filter } from 'lodash';

import { TargetMachineService } from '@core/services/api/rest/target-machine.service';
import { GAActions, GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import { RootStoreState } from '@store';
import * as PipelineActions from '@store/pipelines-store/pipelines.actions';

import { PipelineStageStatusNames } from '@shared/models/pipelines/target-machines/configure-target-pipeline';

@Injectable()
export class PipelinesGAEffects {
  sendFailedStatusGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PipelineActions.onSetupTargetPipelineSocketMessage, PipelineActions.onPingTargetPipelineSocketMessage),
        filter(({ message: pipelines }) =>
          pipelines.some((stage) => stage.status.name === PipelineStageStatusNames.FAILURE)
        ),
        tap(({ message: pipelines }) => {
          const failedStage = pipelines.find((pipeline) => pipeline.status.name === PipelineStageStatusNames.FAILURE);
          const error = _filter(failedStage.stages, (stage) => !!stage.errorMessage);
          this.googleAnalyticsService.emitErrorEvent(GAActions.REMOTE, error[0].errorMessage);
        })
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private targetMachineService: TargetMachineService,
    private googleAnalyticsService: GoogleAnalyticsService
  ) {}
}
