import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { reducer as TargetMachineReducer, targetMachineStoreFeatureKey } from './target-machine.reducer';
import { TargetMachineEffects } from './target-machine.effects';
import { TargetMachineGAEffects } from './target-machine-ga.effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(targetMachineStoreFeatureKey, TargetMachineReducer),
    EffectsModule.forFeature([TargetMachineEffects, TargetMachineGAEffects]),
  ],
})
export class TargetMachineStoreModule {}
