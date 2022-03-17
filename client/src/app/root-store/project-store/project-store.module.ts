import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { Int8CalibrationEffects } from '@store/project-store/int8-calibration-effects';

import { reducer as ProjectStoreReducer } from './project.reducer';
import { ProjectEffects } from './project.effects';
import { ProjectConverterService } from './project-converter.service';
import { ModelTuningEffects } from './model-tuning.effects';
import { DeploymentEffects } from './deployment.effects';
import { ExportProjectEffects } from './export-project.effects';
import { ExportReportEffects } from './export-report.effects';
import { ProjectGAEffects } from './project-ga.effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature('project', ProjectStoreReducer),
    EffectsModule.forFeature([
      ProjectEffects,
      ModelTuningEffects,
      DeploymentEffects,
      Int8CalibrationEffects,
      ExportProjectEffects,
      ExportReportEffects,
      ProjectGAEffects,
    ]),
  ],
  providers: [ProjectConverterService],
})
export class ProjectStoreModule {}
