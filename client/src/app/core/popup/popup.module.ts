import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { PopupComponent } from './popup.component';

@NgModule({
  declarations: [PopupComponent],
  imports: [CommonModule, SharedModule],
})
export class PopupModule {}
