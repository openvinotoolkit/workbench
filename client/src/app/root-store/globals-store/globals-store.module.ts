import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { GlobalsGAEffects } from './globals-ga.effects';
import { EraseAllEffects } from './erase-all.effects';
import { EnvironmentSetupEffects } from './environment-setup.effects';

import { reducer as GlobalsStoreReducer } from './globals.reducer';
import { GlobalsEffects } from './globals.effects';
import { DownloadLogEffects } from './download-log.effects';
import { SocketEffects } from './socket.effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature('globals', GlobalsStoreReducer),
    EffectsModule.forFeature([
      GlobalsEffects,
      GlobalsGAEffects,
      DownloadLogEffects,
      SocketEffects,
      EraseAllEffects,
      EnvironmentSetupEffects,
    ]),
  ],
})
export class GlobalsStoreModule {}
