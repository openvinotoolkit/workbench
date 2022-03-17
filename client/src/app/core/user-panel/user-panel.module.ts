import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserPanelComponent } from '@core/user-panel/user-panel.component';

import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [UserPanelComponent],
  imports: [CommonModule, SharedModule],
  exports: [UserPanelComponent],
})
export class UserPanelModule {}
