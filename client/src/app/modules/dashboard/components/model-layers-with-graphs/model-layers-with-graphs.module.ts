import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { ModelLayersWithGraphsComponent } from './model-layers-with-graphs.component';
import { ModelGraphVisualizationComponent } from './model-graph-visualization/model-graph-visualization.component';
import { NetronGraphComponent } from './model-graph-visualization/netron-graph/netron-graph.component';
import { LayersTableModule } from './layers-table/layers-table.module';
import { ModelGraphVisualizationService } from './model-graph-visualization/model-graph-visualization.service';
import { LayersCompareTableComponent } from './layers-table/layers-compare-table/layers-compare-table.component';
import { SingleModelGraphVisualizationComponent } from './single-model-graph-visualization/single-model-graph-visualization.component';
import { ModelGraphLayersService } from './model-graph-visualization/model-graph-layers.service';

@NgModule({
  imports: [CommonModule, SharedModule, LayersTableModule],
  declarations: [
    ModelLayersWithGraphsComponent,
    ModelGraphVisualizationComponent,
    NetronGraphComponent,
    SingleModelGraphVisualizationComponent,
  ],
  providers: [ModelGraphVisualizationService, ModelGraphLayersService],
  exports: [ModelLayersWithGraphsComponent, LayersCompareTableComponent, SingleModelGraphVisualizationComponent],
})
export class ModelLayersWithGraphsModule {}
