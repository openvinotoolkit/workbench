import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { reducer as InferenceResultStoreReducer } from './inference-result.reducer';
import { InferenceResultEffects } from './inference-result.effects';
import { ExportInferenceReportEffects } from './export-inference-report.effects';
import { ExportInferenceReportGAEffects } from './export-inference-report-ga.effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature('inferenceResult', InferenceResultStoreReducer),
    EffectsModule.forFeature([InferenceResultEffects, ExportInferenceReportEffects, ExportInferenceReportGAEffects]),
  ],
})
export class InferenceResultStoreModule {}
