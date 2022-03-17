import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, concatMap, map, mergeMap, switchMap, takeUntil } from 'rxjs/operators';
import { forkJoin, from, of } from 'rxjs';
import { Action, Store } from '@ngrx/store';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { isNumber } from 'lodash';

import { InferenceRestService } from '@core/services/api/rest/inference-rest.service';
import { UploadFileService } from '@core/services/api/rest/upload-file.service';
import { LabelSetsService } from '@core/services/api/rest/label-sets.service';

import * as InferenceTestImageStoreActions from '@store/inference-test-image-store/inference-test-image.actions';
import { ProjectStatusNames } from '@store/project-store/project.model';
import { FileInfo } from '@store/model-store/model.model';
import * as ModelStoreActions from '@store/model-store/model.actions';
import * as ModelSelectors from '@store/model-store/model.selectors';
import { RootStoreState } from '@store';

import { JobType } from '@shared/models/pipelines/pipeline';

import * as InferenceTestImageStoreSelectors from './inference-test-image.selectors';

@Injectable()
export class InferenceTestImageEffects {
  private _cancelRequest$ = this.actions$.pipe(ofType(InferenceTestImageStoreActions.resetAccuracyState));

  testImage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InferenceTestImageStoreActions.testImage),
      switchMap((action) =>
        this._testImage$(action).pipe(
          takeUntil(this._cancelRequest$),
          withLatestFrom(this.store$.select(ModelSelectors.selectModelById, action.modelId)),
          mergeMap(([pipeline, model]) =>
            [
              action.visualizationConfig
                ? ModelStoreActions.updateAccuracyConfigSuccess({
                    modelItem: {
                      ...model,
                      visualizationConfiguration: action.visualizationConfig,
                    },
                  })
                : null,
              InferenceTestImageStoreActions.testImageSuccess({ data: pipeline }),
            ].filter((v) => !!v)
          ),
          catchError((error) => of(InferenceTestImageStoreActions.testImageFailure({ error })))
        )
      )
    )
  );

  onTestImageInferenceSocketMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InferenceTestImageStoreActions.onImageInferenceSocketMessage),
      concatMap(({ message }) => {
        if ([ProjectStatusNames.RUNNING, ProjectStatusNames.QUEUED].includes(message.status.name)) {
          return [InferenceTestImageStoreActions.upsertInferencePipelines({ data: [message] })];
        }

        const actions: Action[] = [];

        if ([ProjectStatusNames.READY].includes(message.status.name)) {
          const [inferenceTestImageJob] = message.jobs;
          actions.push(InferenceTestImageStoreActions.setTestImage({ data: inferenceTestImageJob.testImage }));
          actions.push(
            InferenceTestImageStoreActions.reportTestInferenceGA({
              testImage: inferenceTestImageJob.testImage,
              modelId: isNumber(inferenceTestImageJob.optimizedFromModelId)
                ? inferenceTestImageJob.optimizedFromModelId
                : inferenceTestImageJob.modelId,
            })
          );
        }

        if ([ProjectStatusNames.ERROR].includes(message.status.name)) {
          actions.push(InferenceTestImageStoreActions.testImageFailure({ error: message.status.errorMessage }));
        }

        return [...actions, InferenceTestImageStoreActions.removeInferencePipeline({ id: message.id })];
      })
    )
  );

  loadLabelSets$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InferenceTestImageStoreActions.loadLabelSets),
      switchMap(() =>
        this.labelSetsService.get$().pipe(
          map((response) => InferenceTestImageStoreActions.loadLabelSetsSuccess({ data: response })),
          takeUntil(this._cancelRequest$),
          catchError((error) => of(InferenceTestImageStoreActions.loadLabelSetsFailure({ error })))
        )
      )
    )
  );

  cancelInferencePipeline$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(InferenceTestImageStoreActions.cancelInferencePipeline),
        withLatestFrom(this.store$.select(InferenceTestImageStoreSelectors.selectInferingPipeline)),
        switchMap(([_, pipeline]) => {
          const { jobId } = pipeline.jobs.find(({ type }) => type === JobType.inference_test_image);
          return this.inferenceRestService.cancelJob$(jobId);
        })
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private inferenceRestService: InferenceRestService,
    private labelSetsService: LabelSetsService,
    private uploadFileService: UploadFileService
  ) {}

  private _testImage$ = ({
    file,
    mask,
    modelId,
    deviceId,
    visualizationConfig,
    visualizationType,
  }: ReturnType<typeof InferenceTestImageStoreActions.testImage>) =>
    this.inferenceRestService
      .startTestImageUpload$(new FileInfo(file), mask ? new FileInfo(mask) : null)
      .pipe(
        switchMap(({ fileId, maskId, imageId }) =>
          forkJoin([
            from(this.uploadFileService.recursiveUploadTestImage(file, fileId)),
            mask ? from(this.uploadFileService.recursiveUploadTestImage(mask, maskId)) : of(null),
          ]).pipe(
            switchMap(() =>
              this.inferenceRestService.startInferenceTestImage$(
                modelId,
                imageId,
                deviceId,
                visualizationConfig,
                visualizationType
              )
            )
          )
        )
      );
}
