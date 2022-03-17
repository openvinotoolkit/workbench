import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import * as fromAuthStore from './auth-store.reducer';
import { AuthStoreEffects } from './auth-store.effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(fromAuthStore.authStoreFeatureKey, fromAuthStore.reducer),
    EffectsModule.forFeature([AuthStoreEffects]),
  ],
})
export class AuthStoreModule {}
