import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { Store } from '@ngrx/store';

import { SnackBarTypes, SnackBarTypesT } from '@core/services/common/popup.config';
import { PopupComponent } from '@core/popup/popup.component';

import { RootStoreState } from '@store';
import * as GlobalsStoreActions from '@store/globals-store/globals.actions';

@Component({
  selector: 'wb-analytics-popup',
  templateUrl: './analytics-popup.component.html',
  styleUrls: ['./analytics-popup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsPopupComponent {
  public snackBarTypes = SnackBarTypes;
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: { message: string; type: SnackBarTypesT },
    public snackBarRef: MatSnackBarRef<PopupComponent>,
    public router: Router,
    private store$: Store<RootStoreState.State>
  ) {}

  public handleAction(agreedCookies: boolean) {
    this.snackBarRef.dismiss();
    this.store$.dispatch(GlobalsStoreActions.setGACollectingStatusAction({ agreedCookies }));
  }
}
