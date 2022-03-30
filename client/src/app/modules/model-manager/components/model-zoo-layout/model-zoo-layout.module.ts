import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { ModelZooLayoutComponent } from './model-zoo-layout.component';
import { ModelZooContentComponent, ModelZooCounterComponent } from './model-zoo-content/model-zoo-content.component';
import {
  ModelZooDetailsComponent,
  ModelZooDetailsDescriptionComponent,
  ModelZooDetailsFooterComponent,
  ModelZooDetailsHeaderComponent,
  ModelZooDetailsParametersComponent,
} from './model-zoo-details/model-zoo-details.component';
import { ModelZooNotificationComponent } from './model-zoo-notification/model-zoo-notification.component';

@NgModule({
  imports: [CommonModule, SharedModule],
  declarations: [
    ModelZooLayoutComponent,
    ModelZooNotificationComponent,
    ModelZooContentComponent,
    ModelZooDetailsComponent,
    ModelZooDetailsHeaderComponent,
    ModelZooDetailsParametersComponent,
    ModelZooDetailsDescriptionComponent,
    ModelZooDetailsFooterComponent,
    ModelZooCounterComponent,
  ],
  exports: [
    ModelZooLayoutComponent,
    ModelZooNotificationComponent,
    ModelZooContentComponent,
    ModelZooDetailsComponent,
    ModelZooDetailsHeaderComponent,
    ModelZooDetailsParametersComponent,
    ModelZooDetailsDescriptionComponent,
    ModelZooDetailsFooterComponent,
    ModelZooCounterComponent,
  ],
})
export class ModelZooLayoutModule {}
