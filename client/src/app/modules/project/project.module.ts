import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { CreateProjectPageComponent } from './pages/create-project-page/create-project-page.component';
import { ProjectRoutingModule } from './project-routing.module';
import { ModelsListComponent } from './components/models-list/models-list.component';
import { DatasetListComponent } from './components/dataset-list/dataset-list.component';
import { EditAccuracyComponent } from './pages/edit-accuracy/edit-accuracy.component';
import { CalibrationConfigurationComponent } from './pages/calibration-configuration/calibration-configuration.component';
import { TargetListComponent } from './components/target-list/target-list.component';
import { PlatformListComponent } from './components/platform-list/platform-list.component';
import { BasicAccuracyConfigurationComponent } from './components/basic-accuracy-configuration/basic-accuracy-configuration.component';
import { AccuracyModule } from '../accuracy/accuracy.module';
import { DatasetManagerModule } from '../dataset-manager/dataset-manager.module';
import { ModelManagerConvertModule } from '../model-manager/components/model-manager-convert/model-manager-convert.module';
import { CalibrationDatasetSectionComponent } from './pages/calibration-configuration/calibration-dataset-section/calibration-dataset-section.component';
import { CreateProjectStagesComponent } from './pages/create-project-page/create-project-stages/create-project-stages.component';
import { SelectModelStageComponent } from './pages/create-project-page/select-model-stage/select-model-stage.component';
import { SelectEnvironmentStageComponent } from './pages/create-project-page/select-environment-stage/select-environment-stage.component';
import { SelectDatasetStageComponent } from './pages/create-project-page/select-dataset-stage/select-dataset-stage.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    ProjectRoutingModule,
    AccuracyModule,
    DatasetManagerModule,
    ModelManagerConvertModule,
  ],
  declarations: [
    CreateProjectPageComponent,
    ModelsListComponent,
    DatasetListComponent,
    EditAccuracyComponent,
    CalibrationConfigurationComponent,
    TargetListComponent,
    PlatformListComponent,
    BasicAccuracyConfigurationComponent,
    CalibrationDatasetSectionComponent,
    CreateProjectStagesComponent,
    SelectModelStageComponent,
    SelectEnvironmentStageComponent,
    SelectDatasetStageComponent,
  ],
})
export class ProjectModule {}
