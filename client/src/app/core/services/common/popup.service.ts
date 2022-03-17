import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { BackendErrorConfig, CookieBannerConfig } from '@core/services/common/popup.config';
import { AnalyticsPopupComponent } from '@core/analytics-popup/analytics-popup.component';

import { PopupComponent } from '../../popup/popup.component';
import { PopupModule } from '../../popup/popup.module';

@Injectable({
  providedIn: PopupModule,
})
export class PopupService {
  constructor(private snackBar: MatSnackBar) {}

  openSnackBar(data) {
    const config = BackendErrorConfig;
    config.data = data;
    this.snackBar.openFromComponent(PopupComponent, config);
  }

  openAnalyticsSnackBar(data) {
    const config = CookieBannerConfig;
    config.data = data;
    this.snackBar.openFromComponent(AnalyticsPopupComponent, config);
  }
}
