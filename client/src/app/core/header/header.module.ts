import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { HeaderComponent } from './header.component';
import { SessionTimerComponent } from './session-timer/session-timer.component';
import { SessionDurationPipe } from './session-timer/session-duration.pipe';

@NgModule({
  declarations: [HeaderComponent, SessionTimerComponent, SessionDurationPipe],
  imports: [CommonModule, SharedModule],
  exports: [HeaderComponent],
})
export class HeaderModule {}
