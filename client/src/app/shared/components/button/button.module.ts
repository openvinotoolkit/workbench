import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonComponent } from '@shared/components/button/button.component';
import { MaterialModule } from '@shared/material.module';

@NgModule({
  imports: [CommonModule, MaterialModule],
  declarations: [ButtonComponent],
  exports: [ButtonComponent],
})
export class ButtonModule {}
