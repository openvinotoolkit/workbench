import { NgModule } from '@angular/core';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { CompareEffects } from './compare.effects';

import { compareFeatureKey, reducer } from './compare.reducer';

@NgModule({
  declarations: [],
  imports: [StoreModule.forFeature(compareFeatureKey, reducer), EffectsModule.forFeature([CompareEffects])],
})
export class CompareStoreModule {}
