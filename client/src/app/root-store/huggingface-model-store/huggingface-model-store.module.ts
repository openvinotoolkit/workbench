import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { HuggingfaceModelStoreEffects } from './huggingface-model-store.effects';
import { reducer } from './huggingface-model-store.reducer';

export const FEATURE_KEY = 'huggingfaceModel';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(FEATURE_KEY, reducer),
    EffectsModule.forFeature([HuggingfaceModelStoreEffects]),
  ],
})
export class HuggingfaceModelStoreModule {}
