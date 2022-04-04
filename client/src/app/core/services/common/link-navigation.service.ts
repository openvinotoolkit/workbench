import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { includes, isNil, isString, startsWith } from 'lodash';
import { filter } from 'rxjs/operators';

import { DialogService } from '@core/services/common/dialog.service';

import { linkRegExp } from '@shared/pipes';

@Injectable({
  providedIn: 'root',
})
export class LinkNavigationService {
  private readonly _externalLinkMessage = this._dialogService.dialogMessages.externalLinkMessage;

  private static _isInternalURL(url: string): boolean {
    return includes(url, location.hostname) || startsWith(url, '/');
  }

  constructor(private _dialogService: DialogService, private _router: Router) {}

  navigate(url: string): void {
    const isValidURL = linkRegExp.test(url);
    // as we use global regex it is needed to reset the state
    // (https://stackoverflow.com/questions/2630418/javascript-regex-returning-true-then-false-then-true-etc)
    linkRegExp.lastIndex = 0;
    if (isNil(url) || !isString(url) || !isValidURL) {
      return;
    }
    if (LinkNavigationService._isInternalURL(url)) {
      this._router.navigateByUrl(url);
      return;
    }
    this._dialogService
      .openConfirmationDialog({ message: this._externalLinkMessage })
      .afterClosed()
      .pipe(filter((res) => !!res))
      .subscribe(() => {
        window.open(url, '_blank');
      });
  }
}
