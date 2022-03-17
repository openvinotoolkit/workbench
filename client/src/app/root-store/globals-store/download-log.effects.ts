import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { Store } from '@ngrx/store';
import { saveAs } from 'file-saver';
import { of } from 'rxjs';

import { CommonRestService } from '@core/services/api/rest/common-rest.service';

import * as GlobalsStoreSelectors from '@store/globals-store/globals.selectors';
import { RootStoreState } from '@store';
import { ProjectStatusNames } from '@store/project-store/project.model';

import * as DownloadLogActions from './download-log.actions';

@Injectable()
export class DownloadLogEffects {
  downloadLog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DownloadLogActions.startLogDownloadAction),
      withLatestFrom(this.store$.select<string>(GlobalsStoreSelectors.selectTabId)),
      switchMap(([, tabId]) =>
        this.commonRestService.initLogDownloading$(tabId).pipe(
          map((response) => {
            const { jobId, artifactId } = response;
            if (!jobId) {
              return DownloadLogActions.logDownloadAction({ artifactId });
            }
            return DownloadLogActions.startLogDownloadSuccess();
          })
        )
      )
    )
  );

  onDownloadLogSocket$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DownloadLogActions.OnDownloadLogSocketAction),
      withLatestFrom(this.store$.select<string>(GlobalsStoreSelectors.selectTabId)),
      filter(
        ([{ artifactId, tabId, status }, currentTabId]) =>
          tabId === currentTabId && status.name === ProjectStatusNames.READY
      ),
      switchMap(([{ artifactId }]) => {
        const path = `${artifactId}.txt`;
        const name = 'server_log.txt';
        return this.commonRestService.downloadFile$(path).pipe(
          map((res) => {
            saveAs(res.body, name);
            return DownloadLogActions.logDownloadSuccess();
          }),
          catchError(() => of(DownloadLogActions.logDownloadFailure()))
        );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private commonRestService: CommonRestService
  ) {}
}
