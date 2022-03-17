import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { AccuracyAnalysisEffects } from './accuracy-analysis-store.effects';
import { accuracyAnalysisFeatureKey, reducer as AccuracyAnalysisStoreReducer } from './accuracy-analysis-store.reducer';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(accuracyAnalysisFeatureKey, AccuracyAnalysisStoreReducer),
    EffectsModule.forFeature([AccuracyAnalysisEffects]),
  ],
})
export class AccuracyAnalysisStoreModule {}
