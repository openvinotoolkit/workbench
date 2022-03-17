import { NgModule } from '@angular/core';

import { SharedModule } from '@shared/shared.module';

import { ModelRoutingModule } from './model-routing.module';
import { ModelPageComponent } from './pages/model-page/model-page.component';
import { AccuracyModule } from '../accuracy/accuracy.module';
import { ModelLayersWithGraphsModule } from '../dashboard/components/model-layers-with-graphs/model-layers-with-graphs.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { ModelInfoComponent } from './components/model-info/model-info.component';
import { ImportTokenizerPageComponent } from './pages/import-tokenizer-page/import-tokenizer-page.component';
import { ImportTokenizerFormComponent } from './pages/import-tokenizer-page/import-tokenizer-form/import-tokenizer-form.component';
import { ModelConfigurationsTabContentComponent } from './pages/model-page/model-configurations-tab-content/model-configurations-tab-content.component';
import { TokenizerRibbonContentComponent } from './pages/model-page/model-configurations-tab-content/tokenizer-ribbon-content/tokenizer-ribbon-content.component';
import { TokenizersTableComponent } from './pages/model-page/model-configurations-tab-content/tokenizer-ribbon-content/tokenizers-table/tokenizers-table.component';
import { ModelProjectsTabContentComponent } from './pages/model-page/model-projects-tab-content/model-projects-tab-content.component';
import { ModelDetailsTabContentComponent } from './pages/model-page/model-details-tab-content/model-details-tab-content.component';
import { ModelVisualizeOutputTabContentComponent } from './pages/model-page/model-visualize-output-tab-content/model-visualize-output-tab-content.component';
import { ModelVisualizeTabContentComponent } from './pages/model-page/model-visualize-tab-content/model-visualize-tab-content.component';

@NgModule({
  declarations: [
    ModelPageComponent,
    ModelInfoComponent,
    ImportTokenizerPageComponent,
    ImportTokenizerFormComponent,
    ModelConfigurationsTabContentComponent,
    TokenizerRibbonContentComponent,
    TokenizersTableComponent,
    ModelProjectsTabContentComponent,
    ModelDetailsTabContentComponent,
    ModelVisualizeOutputTabContentComponent,
    ModelVisualizeTabContentComponent,
  ],
  imports: [SharedModule, ModelRoutingModule, AccuracyModule, ModelLayersWithGraphsModule, DashboardModule],
})
export class ModelModule {}
