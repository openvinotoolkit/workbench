import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { ModelZooFilterGroupComponent } from './model-zoo-filter-group.component';
import { ModelZooFilterComponent, ModelZooFilterTitleComponent } from './model-zoo-filter/model-zoo-filter.component';
import { ModelZooFilterOptionComponent } from './model-zoo-filter/model-zoo-filter-option/model-zoo-filter-option.component';
import { ModelZooFiltersHeaderComponent } from './model-zoo-filters-header/model-zoo-filters-header.component';

@NgModule({
  imports: [CommonModule, SharedModule],
  declarations: [
    ModelZooFilterGroupComponent,
    ModelZooFilterComponent,
    ModelZooFilterTitleComponent,
    ModelZooFilterOptionComponent,
    ModelZooFiltersHeaderComponent,
  ],
  exports: [
    ModelZooFilterGroupComponent,
    ModelZooFilterComponent,
    ModelZooFilterTitleComponent,
    ModelZooFilterOptionComponent,
    ModelZooFiltersHeaderComponent,
  ],
})
export class ModelZooFilterGroupModule {}
