import { InjectionToken, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActionReducerMap, StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';

import { environment } from '@env';

import { AuthStoreModule } from '@store/auth-store/auth-store.module';
import { TargetMachineStoreModule } from '@store/target-machine-store';
import { PipelinesStoreModule } from '@store/pipelines-store';
import { InferenceTestImageStoreModule } from '@store/inference-test-image-store';
import { AdvancedAccuracyStoreModule } from '@store/advanced-accuracy-store/advanced-accuracy-store.module';
import { AccuracyAnalysisStoreModule } from '@store/accuracy-analysis-store';
import { TokenizerStoreModule } from '@store/tokenizer-store/tokenizer-store.module';
import { HuggingfaceModelStoreModule } from '@store/huggingface-model-store';

import { metaReducers, reducers, State } from './state';
import { ModelStoreModule } from './model-store';
import { DatasetStoreModule } from './dataset-store';
import { ProjectStoreModule } from './project-store';
import { InferenceHistoryStoreModule } from './inference-history-store';
import { InferenceResultStoreModule } from './inference-result-store';
import { GlobalsStoreModule } from './globals-store';
import { XmlGraphStoreModule } from './xml-graph-store';
import { RouterStoreModule } from './router-store';
import { CompareStoreModule } from './compare-store';

export const REDUCERS_TOKEN = new InjectionToken<ActionReducerMap<State>>('Registered Reducers', {
  factory: () => reducers,
});

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ModelStoreModule,
    DatasetStoreModule,
    ProjectStoreModule,
    InferenceHistoryStoreModule,
    InferenceResultStoreModule,
    GlobalsStoreModule,
    RouterStoreModule,
    AuthStoreModule,
    XmlGraphStoreModule,
    TargetMachineStoreModule,
    PipelinesStoreModule,
    InferenceTestImageStoreModule,
    CompareStoreModule,
    AdvancedAccuracyStoreModule,
    AccuracyAnalysisStoreModule,
    TokenizerStoreModule,
    HuggingfaceModelStoreModule,

    StoreModule.forRoot(REDUCERS_TOKEN, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: false,
        strictActionImmutability: false,
        strictActionTypeUniqueness: true,
      },
    }),
    EffectsModule.forRoot([]),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
  ],
})
export class RootStoreModule {}
