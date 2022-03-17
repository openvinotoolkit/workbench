import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { reducer as InferenceHistoryStoreReducer } from './inference-history.reducer';
import { InferenceHistoryEffects } from './inference-history.effects';
import { InferenceHistoryGAEffects } from './inference-history-ga.effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature('inferenceHistory', InferenceHistoryStoreReducer),
    EffectsModule.forFeature([InferenceHistoryEffects, InferenceHistoryGAEffects]),
  ],
})
export class InferenceHistoryStoreModule {}
