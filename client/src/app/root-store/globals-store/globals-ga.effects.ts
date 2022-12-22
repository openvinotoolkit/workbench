import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { SnackBarTypes } from '@core/services/common/popup.config';
import { GoogleAnalyticsService } from '@core/services/common/google-analytics.service';
import { CommonRestService } from '@core/services/api/rest/common-rest.service';
import { MessagesService } from '@core/services/common/messages.service';
import { PopupService } from '@core/services/common/popup.service';
import { SyncResponseDTO } from '@core/services/api/rest/sync.service';

import * as GlobalsStoreActions from '@store/globals-store/globals.actions';
import * as GlobalsStoreSelectors from '@store/globals-store/globals.selectors';
import { RootStoreState } from '@store';

@Injectable()
export class GlobalsGAEffects {
  syncSuccessGA$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(GlobalsStoreActions.syncSuccessAction),
        tap(({ syncResponse }: { syncResponse: SyncResponseDTO }) => {
          const { userMeta, version, isDevCloudMode, launchedViaWrapper } = syncResponse;
          this.gAnalyticsService.setDimensions(isDevCloudMode, version);
          this.gAnalyticsService.setAnalyticsCollectionState(userMeta.agreedCookies);
          this.gAnalyticsService.emitLaunchOption(launchedViaWrapper);
        })
      );
    },
    { dispatch: false }
  );

  updateUserMetadata$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GlobalsStoreActions.setUserMetaAction),
      filter((action) => !action.userMeta.viewedWarning),
      map(() => {
        const message = this.messagesService.getTooltip('global', 'cookieUsage');
        this.popupService.openAnalyticsSnackBar({ message, type: SnackBarTypes.COOKIE_SNACK_BAR });
        return GlobalsStoreActions.setBannerIsViewedAction();
      })
    )
  );

  setBannerIsViewed$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GlobalsStoreActions.setBannerIsViewedAction),
      withLatestFrom(this.store$.select(GlobalsStoreSelectors.selectUserMetaInfo)),
      switchMap(([, userMetadata]) =>
        this.commonRestService
          .setUserMeta$({ agreedCookies: userMetadata.agreedCookies, viewedWarning: true })
          .pipe(map((userMeta) => GlobalsStoreActions.setUserMetaAction({ userMeta })))
      )
    )
  );

  setGAStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GlobalsStoreActions.setGACollectingStatusAction),
      withLatestFrom(this.store$.select(GlobalsStoreSelectors.selectUserMetaInfo)),
      switchMap(([action, userMetadata]) => {
        const { agreedCookies } = action;
        if (agreedCookies) {
          this.gAnalyticsService.emitAnalyticsApplyEvent();
        } else {
          this.gAnalyticsService.emitAnalyticsRefuseEvent();
        }
        return this.commonRestService
          .setUserMeta$({ agreedCookies, viewedWarning: userMetadata.viewedWarning })
          .pipe(map((userMeta) => GlobalsStoreActions.setUserMetaAction({ userMeta })));
      })
    )
  );

  constructor(
    private actions$: Actions,
    private commonRestService: CommonRestService,
    private gAnalyticsService: GoogleAnalyticsService,
    private popupService: PopupService,
    private messagesService: MessagesService,
    private store$: Store<RootStoreState.State>
  ) {}
}
