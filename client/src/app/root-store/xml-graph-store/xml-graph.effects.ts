import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';

import { ModelsService } from '@core/services/api/rest/models.service';
import { InferenceRestService } from '@core/services/api/rest/inference-rest.service';

import { RootStoreState } from '@store';

import * as XMLGraphActions from './xml-graph.actions';
import * as XMLGraphSelectors from './xml-graph.selectors';

@Injectable()
export class XmlGraphEffects {
  loadOriginalGraph$ = createEffect(() =>
    this.actions$.pipe(
      ofType(XMLGraphActions.loadOriginalGraphAction),
      withLatestFrom(this.store$.select(XMLGraphSelectors.selectOriginalGraphId)),
      switchMap(([_, originalGraphId]) =>
        this.modelsService.getOriginalModelGraph$(originalGraphId).pipe(
          map(({ xmlContent }) => XMLGraphActions.loadOriginalGraphSuccessAction({ xmlContent })),
          catchError((error) => of(XMLGraphActions.loadOriginalGraphFailureAction({ error })))
        )
      )
    )
  );

  loadRuntimeGraph$ = createEffect(() =>
    this.actions$.pipe(
      ofType(XMLGraphActions.loadRuntimeGraphAction),
      withLatestFrom(this.store$.select(XMLGraphSelectors.selectRuntimeGraphId)),
      switchMap(([_, runtimeGraphId]) =>
        this.inferenceRestService.getExecGraphForJob$(runtimeGraphId).pipe(
          map(({ execGraph }) => XMLGraphActions.loadRuntimeGraphSuccessAction({ xmlContent: execGraph })),
          catchError((error) => of(XMLGraphActions.loadRuntimeGraphFailureAction({ error })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private modelsService: ModelsService,
    private inferenceRestService: InferenceRestService
  ) {}
}
