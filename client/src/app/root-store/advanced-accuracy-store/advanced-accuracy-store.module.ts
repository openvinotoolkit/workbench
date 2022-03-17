import { NgModule } from '@angular/core';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { AdvancedAccuracyStoreEffects } from '@store/advanced-accuracy-store/advanced-accuracy-store.effects';

import { reducer } from './advanced-accuracy-store.reducer';

export const FEATURE_KEY = 'advancedAccuracy';

@NgModule({
  declarations: [],
  imports: [StoreModule.forFeature(FEATURE_KEY, reducer), EffectsModule.forFeature([AdvancedAccuracyStoreEffects])],
})
export class AdvancedAccuracyStoreModule {}
