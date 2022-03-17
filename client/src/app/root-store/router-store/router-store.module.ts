import { NgModule } from '@angular/core';

import { routerReducer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { MergedRouterStateSerializer } from './route-serializer';
import { RouterEffects } from './route.effects';
import { initialState } from './route.state';

export const routerStateConfig = {
  stateKey: 'router',
  serializer: MergedRouterStateSerializer,
  initialState,
};

@NgModule({
  imports: [
    StoreModule.forFeature(routerStateConfig.stateKey, routerReducer, { initialState }),
    StoreRouterConnectingModule.forRoot(routerStateConfig),
    EffectsModule.forFeature([RouterEffects]),
  ],
  exports: [StoreModule, StoreRouterConnectingModule],
})
export class RouterStoreModule {}
