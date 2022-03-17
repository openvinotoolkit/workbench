import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AnalyticsPopupComponent } from '@core/analytics-popup/analytics-popup.component';

import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [AnalyticsPopupComponent],
  imports: [CommonModule, SharedModule],
})
export class AnalyticsPopupModule {}
