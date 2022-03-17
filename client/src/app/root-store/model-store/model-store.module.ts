import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { modelStoreFeatureKey, reducer as ModelStoreReducer } from './model.reducer';
import { ModelEffects } from './model.effects';
import { ModelGAEffects } from './model-ga.effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(modelStoreFeatureKey, ModelStoreReducer),
    EffectsModule.forFeature([ModelEffects, ModelGAEffects]),
  ],
})
export class ModelStoreModule {}
