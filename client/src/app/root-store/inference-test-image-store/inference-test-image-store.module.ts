import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { InferenceTestImageEffects } from '@store/inference-test-image-store/inference-test-image.effects';
import { InferenceTestImageGAEffects } from '@store/inference-test-image-store/inference-test-image-ga.effects';

import { accuracyFeatureKey, reducer as InferenceTestImageStoreReducer } from './inference-test-image.reducer';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(accuracyFeatureKey, InferenceTestImageStoreReducer),
    EffectsModule.forFeature([InferenceTestImageEffects, InferenceTestImageGAEffects]),
  ],
})
export class InferenceTestImageStoreModule {}
