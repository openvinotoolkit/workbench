import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { of } from 'rxjs';

import { HuggingfaceService } from '@core/services/api/rest/huggingface.service';

import * as HuggingfaceModelsActions from './huggingface-model-store.actions';

@Injectable()
export class HuggingfaceModelStoreEffects {
  loadModels$ = createEffect(() =>
    this._actions$.pipe(
      ofType(HuggingfaceModelsActions.loadModelData),
      switchMap(() => {
        const start = Date.now();
        return this._hfService.getModelsData$().pipe(
          map((data) =>
            HuggingfaceModelsActions.loadModelDataSuccess({
              data,
              timeToLoad: Number(((Date.now() - start) / 1000).toFixed(2)),
            })
          ),
          catchError((error) => of(HuggingfaceModelsActions.loadModelDataFailure({ error }))),
          takeUntil(this._actions$.pipe(ofType(HuggingfaceModelsActions.reset)))
        );
      })
    )
  );

  loadModelReadme$ = createEffect(() =>
    this._actions$.pipe(
      ofType(HuggingfaceModelsActions.loadModelReadme),
      switchMap(({ huggingfaceModelId }) =>
        this._hfService.getModelReadme$(huggingfaceModelId).pipe(
          map((readme) => HuggingfaceModelsActions.loadModelReadmeSuccess({ readme, huggingfaceModelId })),
          catchError((error) => of(HuggingfaceModelsActions.loadModelReadmeFailure({ error, huggingfaceModelId }))),
          takeUntil(this._actions$.pipe(ofType(HuggingfaceModelsActions.reset)))
        )
      )
    )
  );

  constructor(private readonly _actions$: Actions, private readonly _hfService: HuggingfaceService) {}
}
