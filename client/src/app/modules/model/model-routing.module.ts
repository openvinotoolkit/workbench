import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ImportTokenizerPageComponent } from './pages/import-tokenizer-page/import-tokenizer-page.component';
import { ModelConfigurationsTabContentComponent } from './pages/model-page/model-configurations-tab-content/model-configurations-tab-content.component';
import { ModelDetailsTabContentComponent } from './pages/model-page/model-details-tab-content/model-details-tab-content.component';
import { ModelPageComponent } from './pages/model-page/model-page.component';
import { ModelProjectsTabContentComponent } from './pages/model-page/model-projects-tab-content/model-projects-tab-content.component';
import { ModelVisualizeOutputTabContentComponent } from './pages/model-page/model-visualize-output-tab-content/model-visualize-output-tab-content.component';
import { ModelVisualizeTabContentComponent } from './pages/model-page/model-visualize-tab-content/model-visualize-tab-content.component';
import { TokenizerRibbonContentComponent } from './pages/model-page/model-configurations-tab-content/tokenizer-ribbon-content/tokenizer-ribbon-content.component';

const routes: Routes = [
  {
    path: ':modelId',
    component: ModelPageComponent,
    children: [
      {
        path: 'projects',
        component: ModelProjectsTabContentComponent,
      },
      {
        path: 'configuration',
        component: ModelConfigurationsTabContentComponent,
        children: [
          {
            path: 'tokenizer',
            component: TokenizerRibbonContentComponent,
          },
          {
            path: '',
            redirectTo: 'tokenizer',
            pathMatch: 'full',
          },
        ],
      },
      {
        path: 'visualize-output',
        component: ModelVisualizeOutputTabContentComponent,
      },
      {
        path: 'visualize-topology',
        component: ModelVisualizeTabContentComponent,
      },
      {
        path: 'details',
        component: ModelDetailsTabContentComponent,
      },
      {
        path: '',
        redirectTo: 'projects',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: ':modelId/tokenizer/import',
    component: ImportTokenizerPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ModelRoutingModule {}
