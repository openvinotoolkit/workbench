import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NotificationComponent } from '@core/notification/notification.component';

import { MaterialModule } from '@shared/material.module';

@NgModule({
  declarations: [NotificationComponent],
  imports: [CommonModule, MaterialModule],
  exports: [NotificationComponent],
})
export class NotificationModule {}
