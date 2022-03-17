import { NgModule } from '@angular/core';

import { HelpTooltipComponent } from './help-tooltip.component';
import { MaterialModule } from '../../material.module';

@NgModule({
  imports: [MaterialModule],
  declarations: [HelpTooltipComponent],
  exports: [HelpTooltipComponent],
})
export class HelpTooltipModule {}
