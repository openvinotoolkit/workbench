import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { mergeMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';

import { Categories, GAActions, GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import { RootStoreState } from '@store';
import * as ExportInferenceReportActions from '@store/inference-result-store/export-inference-report.actions';
import { modelDomainNames, ModelItem, TaskMethodToNameMap } from '@store/model-store/model.model';
import * as ModelStoreSelectors from '@store/model-store/model.selectors';

@Injectable()
export class ExportInferenceReportGAEffects {
  reportExportGA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ExportInferenceReportActions.exportInferenceResultReportSuccess),
        mergeMap((payload) =>
          of(payload).pipe(
            withLatestFrom(this.store$.select<ModelItem>(ModelStoreSelectors.selectModelById, payload.modelId))
          )
        ),
        tap(([_, model]) => {
          const modelType = TaskMethodToNameMap[model.accuracyConfiguration.taskMethod];
          const modelDomain = modelDomainNames[model.domain];
          this.googleAnalyticsService.emitEvent(GAActions.EXPORT, Categories.EXPORT_REPORT, {
            reportType: 'Per-layer',
            modelType,
            modelDomain,
          });
        })
      ),
    { dispatch: false }
  );

  reportExportGAError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ExportInferenceReportActions.exportInferenceResultReportFailure),
        tap(({ error }) => {
          this.googleAnalyticsService.emitErrorEvent(GAActions.EXPORT, error);
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
