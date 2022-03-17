import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { reducer as DatasetStoreReducer } from './dataset.reducer';
import { DatasetEffects } from './dataset.effects';
import { DatasetGAEffects } from './dataset-ga.effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature('dataset', DatasetStoreReducer),
    EffectsModule.forFeature([DatasetEffects, DatasetGAEffects]),
  ],
})
export class DatasetStoreModule {}
