import { from, Observable, of, timer } from 'rxjs';
import { map, mergeMap, startWith, takeWhile, tap } from 'rxjs/operators';

import {
  ICompoundInference,
  IInferenceResult,
  InferenceUtils,
} from '@store/inference-history-store/inference-history.model';
import { ProjectStatus, ProjectStatusNames } from '@store/project-store/project.model';

import { IProfilingPipeline } from '@shared/models/pipelines/profiling-pipeline';
import { IInt8CalibrationPipeline } from '@shared/models/pipelines/int8-calibration-pipeline';
import { JobType, PipelineStage } from '@shared/models/pipelines/pipeline';

/**
 * Build an observable which emits progress based on estimated inference time
 *
 * @param inference
 */
const singleInferenceProgress$ = ({ deviceType, started, inferenceTime }: IInferenceResult): Observable<number> => {
  if (!started) {
    return of(0);
  }

  const totalEstimatedTime = InferenceUtils.calcEstimatedInferenceTime(deviceType, inferenceTime);
  const passedTime = Date.now() - started;

  if (passedTime > totalEstimatedTime) {
    return of(99);
  }

  const startPercent = Math.round((passedTime / totalEstimatedTime) * 100);
  const count = Math.round(100 - startPercent);
  const frequency = (totalEstimatedTime - passedTime) / count;

  return timer(0, frequency).pipe(
    map(() => Math.round(((Date.now() - started) / totalEstimatedTime) * 100)),
    takeWhile((progress) => progress < 100),
    startWith(startPercent)
  );
};

export const singleInferenceStatus$ = (inferenceResult: IInferenceResult): Observable<ProjectStatus> => {
  return singleInferenceProgress$(inferenceResult).pipe(
    map((progress) => ({
      progress,
      name: ProjectStatusNames.RUNNING,
      stage: ProjectStatus.stagesMap.ProfilingJob,
    }))
  );
};

/**
 * Build an observable which emits status based on a group of single inferences estimations
 *
 * @param inferences
 */
export const compoundInferenceStatus$ = (inferences: IInferenceResult[]): Observable<ProjectStatus> => {
  const progressMap = inferences.reduce<{ [inferenceId: number]: number }>((acc, i) => {
    if (i.status.name === ProjectStatusNames.READY) {
      acc[i.id] = 100;
    } else if (i.status.name === ProjectStatusNames.QUEUED || i.status.name === ProjectStatusNames.RUNNING) {
      acc[i.id] = 0;
    }

    return acc;
  }, {});

  const getStatus = (): ProjectStatus => {
    const sum = Object.values(progressMap).reduce((acc, p) => (acc += p), 0);
    const progress = sum / Object.keys(progressMap).length;
    return {
      progress: Math.min(progress, 99),
      name: ProjectStatusNames.RUNNING,
      stage: ProjectStatus.stagesMap.ProfilingJob,
    };
  };

  const activeInferences = inferences.filter((i) => [ProjectStatusNames.RUNNING].includes(i.status.name));
  return from(activeInferences).pipe(
    mergeMap((i) => singleInferenceProgress$(i).pipe(tap((progress) => (progressMap[i.id] = progress)))),
    map(() => getStatus()),
    startWith(getStatus())
  );
};

const PIPELINE_STAGE_NAME = {
  [PipelineStage.PREPARING_SETUP_ASSETS]: 'Preparing',
  [PipelineStage.PREPARING_PROFILING_ASSETS]: 'Preparing',
  [PipelineStage.UPLOADING_SETUP_ASSETS]: 'Uploading',
  [PipelineStage.PREPARING_INT8_CALIBRATION_ASSETS]: 'Preparing',
  [PipelineStage.INT8_CALIBRATION]: 'Calibration',
  [PipelineStage.MODEL_ANALYZER]: 'Analysis',
  [PipelineStage.GETTING_REMOTE_JOB_RESULT]: 'Completing',
};

/**
 * Builds an observable which emits status based on a pipeline jobs.
 * Status for all jobs but CompoundInference emitted as is
 * Status for CompoundInference estimated based on compoundInferenceStatus$
 *
 * @param pipeline
 */
export const profilingStatus$ = (
  pipeline: IProfilingPipeline | IInt8CalibrationPipeline
): Observable<ProjectStatus> => {
  if (pipeline.status.stage !== PipelineStage.PROFILING) {
    return of({
      progress: pipeline.status.progress,
      name: pipeline.status.name as unknown as ProjectStatusNames,
      stage: PIPELINE_STAGE_NAME[pipeline.status.stage],
    });
  }
  const job = pipeline.jobs.find((j) => j.type === JobType.profiling_job) as ICompoundInference;
  return compoundInferenceStatus$(job.inferences).pipe(
    map((status) => {
      const jobsLength = pipeline.jobs.length;
      const progress = ((jobsLength - 1) / jobsLength) * 100 + status.progress / jobsLength;
      return { ...status, progress: Math.min(progress, 99) };
    })
  );
};
