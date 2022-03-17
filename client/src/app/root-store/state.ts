import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { routerReducer, RouterReducerState } from '@ngrx/router-store';

import { environment } from '@env';

import { InferenceStoreReducer, InferenceStoreState } from '@store/inference-test-image-store';

import { ModelStoreState } from './model-store';
import { DatasetStoreReducer, DatasetStoreState } from './dataset-store';
import { ProjectStoreReducer, ProjectStoreState } from './project-store';
import { InferenceHistoryStoreReducer, InferenceHistoryStoreState } from './inference-history-store';
import { InferenceResultStoreReducer, InferenceResultStoreState } from './inference-result-store';
import { GlobalsStoreReducer, GlobalsStoreState } from './globals-store';
import { XMLGraphStoreReducer, XMLGraphStoreState } from './xml-graph-store';
import { TargetMachineStoreState } from './target-machine-store';
import { PipelinesStoreState } from './pipelines-store';
import * as fromAuthStore from './auth-store/auth-store.reducer';
import * as fromTargetMachineStore from './target-machine-store/target-machine.reducer';
import * as fromPipelinesStore from './pipelines-store/pipelines.reducer';
import * as fromXMLGraphStore from './xml-graph-store/xml-graph.reducer';
import * as fromModelStore from './model-store/model.reducer';
import * as AdvancedAccuracyStore from './advanced-accuracy-store';
import * as TokenizerStore from './tokenizer-store';
import * as fromAccuracyAnalysisStore from './accuracy-analysis-store';

export interface State {
  inferenceTestImage: InferenceStoreState.State;
  [fromModelStore.modelStoreFeatureKey]: ModelStoreState.State;
  [AdvancedAccuracyStore.FEATURE_KEY]: AdvancedAccuracyStore.AdvancedAccuracyStoreState.State;
  dataset: DatasetStoreState.State;
  project: ProjectStoreState.State;
  inferenceHistory: InferenceHistoryStoreState.State;
  inferenceResult: InferenceResultStoreState.State;
  globals: GlobalsStoreState.State;
  router: RouterReducerState;
  [fromXMLGraphStore.xmlGraphStoreFeatureKey]: XMLGraphStoreState.State;
  [fromAuthStore.authStoreFeatureKey]: fromAuthStore.State;
  [fromTargetMachineStore.targetMachineStoreFeatureKey]: TargetMachineStoreState.State;
  [fromPipelinesStore.pipelinesStoreFeatureKey]: PipelinesStoreState.State;
  [fromAccuracyAnalysisStore.accuracyAnalysisFeatureKey]: fromAccuracyAnalysisStore.AccuracyAnalysisStoreState.State;
  [TokenizerStore.FEATURE_KEY]: TokenizerStore.TokenizerState.State;
}

interface GenericErrorObject {
  [key: string]: GenericErrorObject | string;
}

export type ErrorState = string | GenericErrorObject;

export const reducers: ActionReducerMap<State> = {
  inferenceTestImage: InferenceStoreReducer,
  [fromModelStore.modelStoreFeatureKey]: fromModelStore.reducer,
  [AdvancedAccuracyStore.FEATURE_KEY]: AdvancedAccuracyStore.reducer,
  dataset: DatasetStoreReducer,
  project: ProjectStoreReducer,
  inferenceHistory: InferenceHistoryStoreReducer,
  inferenceResult: InferenceResultStoreReducer,
  globals: GlobalsStoreReducer,
  [fromXMLGraphStore.xmlGraphStoreFeatureKey]: XMLGraphStoreReducer,
  router: routerReducer,
  [fromAuthStore.authStoreFeatureKey]: fromAuthStore.reducer,
  [fromTargetMachineStore.targetMachineStoreFeatureKey]: fromTargetMachineStore.reducer,
  [fromPipelinesStore.pipelinesStoreFeatureKey]: fromPipelinesStore.reducer,
  [fromAccuracyAnalysisStore.accuracyAnalysisFeatureKey]: fromAccuracyAnalysisStore.AccuracyAnalysisStoreReducer,
  [TokenizerStore.FEATURE_KEY]: TokenizerStore.reducer,
};

export const metaReducers: MetaReducer<State>[] = !environment.production ? [] : [];
