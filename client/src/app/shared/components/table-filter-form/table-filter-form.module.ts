import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TableFilterFormComponent } from '@shared/components/table-filter-form/table-filter-form.component';
import { MaterialModule } from '@shared/material.module';
import { ButtonModule } from '@shared/components/button/button.module';
import { MultipleSelectModule } from '@shared/components/multiple-select/multiple-select.module';
import { DirectivesModule } from '@shared/directives/directives.module';

@NgModule({
  declarations: [TableFilterFormComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    ButtonModule,
    MultipleSelectModule,
    DirectivesModule,
  ],
  exports: [TableFilterFormComponent],
})
export class TableFilterFormModule {}
