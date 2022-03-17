import { NgModule } from '@angular/core';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { reducer } from './tokenizer-store.reducer';
import { TokenizerEffects } from './tokenizer-store.effects';

export const FEATURE_KEY = 'tokenizer';

@NgModule({
  imports: [StoreModule.forFeature(FEATURE_KEY, reducer), EffectsModule.forFeature([TokenizerEffects])],
})
export class TokenizerStoreModule {}
