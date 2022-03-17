import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { reducer as PipelinesReducer, pipelinesStoreFeatureKey } from './pipelines.reducer';
import { PipelinesEffects } from './pipelines.effects';
import { PipelinesGAEffects } from './pipelines-ga.effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(pipelinesStoreFeatureKey, PipelinesReducer),
    EffectsModule.forFeature([PipelinesEffects, PipelinesGAEffects]),
  ],
})
export class PipelinesStoreModule {}
