import { Component, OnInit } from '@angular/core';

import { Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';
import { NotificationService, NotificationType } from '@core/services/common/notification.service';

import { GlobalsStoreActions, GlobalsStoreSelectors, RootStoreState } from '@store';
import * as AuthStoreActions from '@store/auth-store/auth-store.actions';
import * as DownloadLogActions from '@store/globals-store/download-log.actions';
import * as EraseAllActions from '@store/globals-store/erase-all.actions';
import * as AuthStoreSelectors from '@store/auth-store/auth-store.selectors';

@Component({
  selector: 'wb-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  isAuthenticated$ = this.store$.select(AuthStoreSelectors.selectIsAuthenticated);
  version$ = this.store$.select(GlobalsStoreSelectors.selectVersion);
  userMeta$ = this.store$.select(GlobalsStoreSelectors.selectUserMetaInfo);
  taskIsRunning$ = this.store$.select(GlobalsStoreSelectors.selectTaskIsRunning);
  isAuthEnabled$ = this.store$.select(GlobalsStoreSelectors.selectIsAuthEnabled);
  isDevCloudNotAvailable$ = this.store$.select(GlobalsStoreSelectors.selectIsDevCloudNotAvailable);
  isJupyterAvailable$ = this.store$.select(GlobalsStoreSelectors.selectIsJupyterAvailable);

  private _browserInformationMessage = this.messagesService.dialogMessages.browserInformation;
  public devCloudMessages = this.messagesService.hintMessages.devCloud;

  constructor(
    private store$: Store<RootStoreState.State>,
    private messagesService: MessagesService,
    public notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._checkBrowserUserAgent();
    this.isAuthenticated$.pipe(filter((isAuthenticated) => isAuthenticated)).subscribe(() => {
      this.store$.dispatch(GlobalsStoreActions.syncAction());
      this.store$.dispatch(GlobalsStoreActions.getSupportedFeaturesPreview());
    });
  }

  private _checkBrowserUserAgent(): void {
    const isChromeBrowser = navigator.userAgent.match(/Chrome/);
    // todo: save flag to localstorage or user metadata
    if (!isChromeBrowser) {
      const { title, message } = this._browserInformationMessage;
      this.notificationService.add(title, message, NotificationType.DEFAULT);
    }
  }

  logoutUser(): void {
    this.store$.dispatch(AuthStoreActions.logoutAction());
  }

  handleGAStatusChange(status: boolean): void {
    this.store$.dispatch(GlobalsStoreActions.setGACollectingStatusAction({ agreedCookies: status }));
  }

  downloadLogFile(): void {
    this.store$.dispatch(DownloadLogActions.startLogDownloadAction());
  }

  eraseAll(): void {
    this.store$.dispatch(EraseAllActions.eraseAll());
  }
}
