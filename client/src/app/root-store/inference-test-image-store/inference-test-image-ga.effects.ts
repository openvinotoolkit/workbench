import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { filter, mergeMap, tap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';

import { InferenceRestService } from '@core/services/api/rest/inference-rest.service';
import { LabelSetsService } from '@core/services/api/rest/label-sets.service';
import { UploadFileService } from '@core/services/api/rest/upload-file.service';
import { Categories, GAActions, GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import * as InferenceTestImageStoreActions from '@store/inference-test-image-store/inference-test-image.actions';
import * as ModelStoreSelectors from '@store/model-store/model.selectors';
import { RootStoreState } from '@store';

@Injectable()
export class InferenceTestImageGAEffects {
  reportTestInferGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(InferenceTestImageStoreActions.reportTestInferenceGA),
        mergeMap(({ modelId, testImage }) =>
          of(testImage).pipe(withLatestFrom(this.store$.select(ModelStoreSelectors.selectModelById, modelId)))
        ),
        filter(([_, model]) => !!model),
        tap(([testImage, model]) => this.googleAnalyticsService.emitTestInferenceEvent(testImage, model))
      ),
    { dispatch: false }
  );

  reportEarlyVisualizeGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(InferenceTestImageStoreActions.testImage),
        filter(({ early }) => early),
        tap(() => this.googleAnalyticsService.emitEvent(GAActions.EARLY_TEST_INFER, Categories.TEST_INFER))
      ),
    { dispatch: false }
  );
  reportTestInferErrorGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(InferenceTestImageStoreActions.testImageFailure),
        tap(({ error }) => {
          this.googleAnalyticsService.emitErrorEvent(GAActions.TEST_INFERENCE, error);
        })
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private inferenceRestService: InferenceRestService,
    private labelSetsService: LabelSetsService,
    private uploadFileService: UploadFileService,
    private googleAnalyticsService: GoogleAnalyticsService,
    private store$: Store<RootStoreState.State>
  ) {}
}
