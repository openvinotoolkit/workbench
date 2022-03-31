import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';

import { GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import * as HuggingfaceModelsActions from './huggingface-model-store.actions';

@Injectable()
export class HuggingfaceModelStoreGaEffects {
  loadModels$ = createEffect(
    () =>
      this._actions$.pipe(
        ofType(HuggingfaceModelsActions.loadModelDataSuccess),
        tap(({ timeToLoad }) => this._ga.emitHuggingfaceListLoad(timeToLoad))
      ),
    { dispatch: false }
  );

  loadModelsFailed$ = createEffect(
    () =>
      this._actions$.pipe(
        ofType(HuggingfaceModelsActions.loadModelDataFailure),
        tap(({ error }) => this._ga.emitHuggingfaceListLoadFailure(error.toString()))
      ),
    { dispatch: false }
  );

  loadReadmeSuccess$ = createEffect(
    () =>
      this._actions$.pipe(
        ofType(HuggingfaceModelsActions.loadModelReadmeSuccess),
        tap(({ huggingfaceModelId }) => this._ga.emitHuggingfaceLoadReadmeSuccess(huggingfaceModelId))
      ),
    { dispatch: false }
  );

  loadReadmeFailure$ = createEffect(
    () =>
      this._actions$.pipe(
        ofType(HuggingfaceModelsActions.loadModelReadmeFailure),
        tap(({ error, huggingfaceModelId }) =>
          this._ga.emitHuggingfaceLoadReadmeFailure(huggingfaceModelId, error.toString())
        )
      ),
    { dispatch: false }
  );

  constructor(private readonly _actions$: Actions, private readonly _ga: GoogleAnalyticsService) {}
}
