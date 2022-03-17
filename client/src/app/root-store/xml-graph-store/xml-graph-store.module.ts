import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { reducer as XMLGraphStoreReducer, xmlGraphStoreFeatureKey } from './xml-graph.reducer';
import { XmlGraphEffects } from './xml-graph.effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(xmlGraphStoreFeatureKey, XMLGraphStoreReducer),
    EffectsModule.forFeature([XmlGraphEffects]),
  ],
})
export class XmlGraphStoreModule {}
