import { ChangeDetectionStrategy, Component } from '@angular/core';

import { timer } from 'rxjs';
import { filter, map, startWith, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';

import { ICompoundInference, InferenceUtils } from '@store/inference-history-store/inference-history.model';
import { RootStoreState } from '@store';
import * as ProjectStoreSelectors from '@store/project-store/project.selectors';
import { selectRunningProfilingPipelines } from '@store/inference-history-store/inference-history.selectors';
import { cancelInference } from '@store/inference-history-store/inference-history.actions';

import { IProfilingPipeline } from '@shared/models/pipelines/profiling-pipeline';
import { IInt8CalibrationPipeline } from '@shared/models/pipelines/int8-calibration-pipeline';
import {
  JobType,
  LOCAL_PIPELINE_TYPES_WITH_PROFILING,
  PipelineStage,
  PipelineType,
} from '@shared/models/pipelines/pipeline';

@Component({
  selector: 'wb-running-inference-overlay',
  templateUrl: './running-inference-overlay.component.html',
  styleUrls: ['./running-inference-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunningInferenceOverlayComponent {
  readonly pipelineType = PipelineType;
  readonly pipelineStage = PipelineStage;
  readonly LOCAL_PIPELINE_TYPES_WITH_PROFILING = LOCAL_PIPELINE_TYPES_WITH_PROFILING;

  isCancelling = false;

  readonly profilingPipeline$ = this.store$.select(selectRunningProfilingPipelines).pipe(
    filter((pipelines) => !!pipelines.length),
    map((pipelines) => pipelines[0]),
    startWith(null as IProfilingPipeline)
  );

  readonly optimizationPipeline$ = this.store$.select(ProjectStoreSelectors.selectRunningInt8CalibrationPipelines).pipe(
    filter((pipelines) => !!pipelines.length),
    map((pipelines) =>
      pipelines.find((pipeline) =>
        [
          PipelineStage.PREPARING_PROFILING_ASSETS,
          PipelineStage.UPLOADING_SETUP_ASSETS,
          PipelineStage.PROFILING,
        ].includes(pipeline.status.stage)
      )
    ),
    filter((pipeline) => !!pipeline),
    startWith(null as IInt8CalibrationPipeline)
  );

  readonly estimatedTime$ = timer(0, 1000).pipe(
    withLatestFrom(this.profilingPipeline$, this.optimizationPipeline$),
    map(([_, remoteProfilingPipeline, optimizationPipeline]) => {
      const pipeline = remoteProfilingPipeline || optimizationPipeline;
      if (pipeline && pipeline.status.stage === PipelineStage.PROFILING) {
        return pipeline.jobs.find((j) => j.type === JobType.profiling_job);
      }
      return {} as ICompoundInference;
    }),
    map(this.calcRemainingEstimatedTime),
    startWith(-1)
  );

  readonly operationInfoMessage = this._messagesService.dialogMessages.inferenceOverlay.operationInfo;
  readonly cancellationWarningMessage = this._messagesService.dialogMessages.inferenceOverlay.cancellationWarning;

  constructor(private store$: Store<RootStoreState.State>, private _messagesService: MessagesService) {}

  private calcRemainingEstimatedTime({ deviceType, inferences, inferenceTime, started }: ICompoundInference): number {
    if (!started) {
      return -1;
    }
    const totalEstimatedTime = InferenceUtils.calcEstimatedInferenceTime(deviceType, inferenceTime) * inferences.length;
    const result = totalEstimatedTime - (Date.now() - started);
    return result > 0 ? result : 0;
  }

  cancelProfilingPipeline(pipeline: IProfilingPipeline): void {
    if (pipeline.status.stage !== PipelineStage.PROFILING || this.isCancelling) {
      return;
    }
    this.isCancelling = true;
    const { jobId } = pipeline.jobs.find((j) => j.type === JobType.profiling_job);
    this.store$.dispatch(cancelInference({ jobId }));
  }
}
