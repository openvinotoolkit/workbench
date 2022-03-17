import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { LayersSingleTableComponent } from './layers-single-table/layers-single-table.component';
import { LayersTableService } from './layers-table.service';
import { LayerDetailsComponent } from './layer-details/layer-details.component';
import { LayersCompareTableComponent } from './layers-compare-table/layers-compare-table.component';
import { LayersFlowchartComponent } from './layers-flowchart/layers-flowchart.component';
import { ParameterNamePipe } from './parameter-name.pipe';

@NgModule({
  declarations: [
    LayersSingleTableComponent,
    LayerDetailsComponent,
    LayersCompareTableComponent,
    LayersFlowchartComponent,
    ParameterNamePipe,
  ],
  imports: [CommonModule, SharedModule],
  providers: [LayersTableService, DecimalPipe],
  exports: [LayersSingleTableComponent, LayersCompareTableComponent],
})
export class LayersTableModule {}
