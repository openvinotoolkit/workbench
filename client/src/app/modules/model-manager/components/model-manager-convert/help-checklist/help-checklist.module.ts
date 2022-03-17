import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '@shared/material.module';

import { HelpChecklistComponent } from './help-checklist.component';
import { HelpChecklistItemComponent } from './help-checklist-item/help-checklist-item.component';
import { HelpChecklistService } from './help-checklist.service';

@NgModule({
  declarations: [HelpChecklistComponent, HelpChecklistItemComponent],
  imports: [CommonModule, MaterialModule],
  providers: [HelpChecklistService],
  exports: [HelpChecklistComponent, HelpChecklistItemComponent],
})
export class HelpChecklistModule {}
