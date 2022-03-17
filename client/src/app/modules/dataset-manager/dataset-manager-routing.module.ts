import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DatasetManagerWizardComponent } from './pages/dataset-manager-wizard/dataset-manager-wizard.component';
import { ImportCalibrationDatasetComponent } from './pages/import-calibration-dataset/import-calibration-dataset.component';
import { ImportTextDatasetPageComponent } from './pages/import-text-dataset-page/import-text-dataset-page.component';

const datasetManagerRoutes: Routes = [
  {
    path: 'import',
    component: DatasetManagerWizardComponent,
  },
  {
    path: 'import-calibration-dataset',
    component: ImportCalibrationDatasetComponent,
  },
  {
    path: 'text-dataset/import',
    component: ImportTextDatasetPageComponent,
  },
  {
    path: '**',
    redirectTo: '/',
  },
];

@NgModule({
  imports: [RouterModule.forChild(datasetManagerRoutes)],
  exports: [RouterModule],
})
export class DatasetManagerRoutingModule {}
