import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MultipleSelectComponent } from '@shared/components/multiple-select/multiple-select.component';
import { MaterialModule } from '@shared/material.module';

@NgModule({
  declarations: [MultipleSelectComponent],
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  exports: [MultipleSelectComponent],
})
export class MultipleSelectModule {}
