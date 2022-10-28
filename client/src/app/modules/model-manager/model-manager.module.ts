import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { ModelManagerRoutingModule } from './model-manager-routing.module';
import { ModelManagerWizardComponent } from './components/model-manager-wizard/model-manager-wizard.component';
import { ModelManagerImportComponent } from './components/model-manager-import/model-manager-import.component';
import { ProjectModule } from '../project/project.module';
import { ModelManagerConvertModule } from './components/model-manager-convert/model-manager-convert.module';
import { ReshapeComponent } from './components/reshape/reshape.component';
import { ImportPageComponent } from './pages/import-page/import-page.component';
import { EditPageComponent } from './pages/edit-page/edit-page.component';
import { CardModule } from './components/card/card.module';
import { CardDefDirective, CardGridComponent } from './components/card-grid/card-grid.component';
import { ModelZooLayoutModule } from './components/model-zoo-layout/model-zoo-layout.module';
import { ModelZooFilterGroupModule } from './components/model-zoo-filter-group/model-zoo-filter-group.module';
import { OmzImportRibbonContentComponent } from './components/omz-import-ribbon-content/omz-import-ribbon-content.component';
import { OmzModelDetailsComponent } from './components/omz-import-ribbon-content/omz-model-details/omz-model-details.component';
import { HuggingFaceImportRibbonContentComponent } from './components/hugging-face-import-ribbon-content/hugging-face-import-ribbon-content.component';
import { HuggingfaceModelDetailsComponent } from './components/hugging-face-import-ribbon-content/huggingface-model-details/huggingface-model-details.component';
import { CardGridSkeletonComponent } from './components/card-grid-skeleton/card-grid-skeleton.component';

@NgModule({
  declarations: [
    ModelManagerWizardComponent,
    ModelManagerImportComponent,
    ReshapeComponent,
    ImportPageComponent,
    EditPageComponent,
    CardGridComponent,
    CardDefDirective,
    OmzImportRibbonContentComponent,
    OmzModelDetailsComponent,
    HuggingFaceImportRibbonContentComponent,
    HuggingfaceModelDetailsComponent,
    CardGridSkeletonComponent,
  ],
  imports: [
    CommonModule,
    ModelManagerRoutingModule,
    SharedModule,
    ProjectModule,
    ModelManagerConvertModule,
    CardModule,
    ModelZooLayoutModule,
    ModelZooFilterGroupModule,
  ],
})
export class ModelManagerModule {}
