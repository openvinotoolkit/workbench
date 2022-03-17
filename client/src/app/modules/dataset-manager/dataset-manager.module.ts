import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { DatasetManagerWizardComponent } from './pages/dataset-manager-wizard/dataset-manager-wizard.component';
import { DatasetManagerRoutingModule } from './dataset-manager-routing.module';
import { DatasetUploadComponent } from './components/dataset-upload/dataset-upload.component';
import { CreateDatasetComponent } from './components/create-dataset/create-dataset.component';
import { ImagesPreviewComponent } from './components/images-preview/images-preview.component';
import { ImportCalibrationDatasetComponent } from './pages/import-calibration-dataset/import-calibration-dataset.component';
import { DatasetAugmentationComponent } from './components/create-dataset/dataset-augmentation/dataset-augmentation.component';
import { GeneralAugmentationSectionComponent } from './components/create-dataset/dataset-augmentation/general-augmentation-section/general-augmentation-section.component';
import { ColorTransformationsSectionComponent } from './components/create-dataset/dataset-augmentation/color-transformations-section/color-transformations-section.component';
import { SectionSummaryComponent } from './components/create-dataset/dataset-augmentation/section-summary/section-summary.component';
import { ImportTextDatasetPageComponent } from './pages/import-text-dataset-page/import-text-dataset-page.component';
import { TextDatasetDataComponent } from './pages/import-text-dataset-page/text-dataset-data/text-dataset-data.component';
import { TextDatasetPreviewComponent } from './pages/import-text-dataset-page/text-dataset-data/text-dataset-preview/text-dataset-preview.component';
import { RawTextDatasetPreviewComponent } from './pages/import-text-dataset-page/text-dataset-data/text-dataset-preview/raw-text-dataset-preview/raw-text-dataset-preview.component';
import { DataTextDatasetPreviewComponent } from './pages/import-text-dataset-page/text-dataset-data/text-dataset-preview/data-text-dataset-preview/data-text-dataset-preview.component';
import { ClassificationColumnsFormComponent } from './pages/import-text-dataset-page/text-dataset-data/classification-columns-form/classification-columns-form.component';
import { EntailmentColumnsFormComponent } from './pages/import-text-dataset-page/text-dataset-data/entailment-columns-form/entailment-columns-form.component';
import { TextDatasetInfoComponent } from './pages/import-text-dataset-page/text-dataset-info/text-dataset-info.component';
import { TextClassificationDatasetInfoComponent } from './pages/import-text-dataset-page/text-dataset-info/text-classification-dataset-info/text-classification-dataset-info.component';
import { TextualEntailmentDatasetInfoComponent } from './pages/import-text-dataset-page/text-dataset-info/textual-entailment-dataset-info/textual-entailment-dataset-info.component';

@NgModule({
  declarations: [
    DatasetManagerWizardComponent,
    ImportCalibrationDatasetComponent,
    DatasetUploadComponent,
    CreateDatasetComponent,
    ImagesPreviewComponent,
    DatasetAugmentationComponent,
    GeneralAugmentationSectionComponent,
    ColorTransformationsSectionComponent,
    SectionSummaryComponent,
    ImportTextDatasetPageComponent,
    TextDatasetDataComponent,
    TextDatasetPreviewComponent,
    RawTextDatasetPreviewComponent,
    DataTextDatasetPreviewComponent,
    ClassificationColumnsFormComponent,
    EntailmentColumnsFormComponent,
    TextDatasetInfoComponent,
    TextClassificationDatasetInfoComponent,
    TextualEntailmentDatasetInfoComponent,
  ],
  providers: [DecimalPipe],
  imports: [CommonModule, SharedModule, DatasetManagerRoutingModule],
  exports: [DatasetUploadComponent],
})
export class DatasetManagerModule {}
