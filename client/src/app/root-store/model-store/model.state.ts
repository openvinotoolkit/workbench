import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';

import { ErrorState } from '@store/state';

import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';
import { IConfigurePipeline } from '@shared/models/pipelines/configure-pipeline';

import { ModelItem, TransformationsConfig } from './model.model';

export const modelItemAdapter: EntityAdapter<ModelItem> = createEntityAdapter<ModelItem>({
  selectId: (model) => model.id,
  sortComparer: (a: ModelItem, b: ModelItem): number => a.name.toString().localeCompare(b.name.toString()),
});

export const modelDownloaderItemAdapter: EntityAdapter<ModelDownloaderDTO> = createEntityAdapter<ModelDownloaderDTO>({
  selectId: (model) => `${model.name}-${model.precision}`,
  sortComparer: (a: ModelDownloaderDTO, b: ModelDownloaderDTO): number =>
    a.name.toString().localeCompare(b.name.toString()),
});

interface OMZModelsState extends EntityState<ModelDownloaderDTO> {
  isLoading?: boolean;
  error?: ErrorState;
}

export interface State extends EntityState<ModelItem> {
  omzModels: OMZModelsState;
  selectedModel: ModelItem;
  importingModelId: number;
  uploadingIds: number[];
  availableTransformationsConfigs: TransformationsConfig[];
  accuracyConfigSavePending: boolean;
  runningConfigurePipeline: IConfigurePipeline;
  isLoading?: boolean;
  error?: ErrorState;
}

export const initialState: State = modelItemAdapter.getInitialState({
  omzModels: modelDownloaderItemAdapter.getInitialState({
    isLoading: false,
    error: null,
  }),
  selectedModel: null,
  importingModelId: null,
  uploadingIds: [],
  accuracyConfigSavePending: false,
  availableTransformationsConfigs: null,
  runningConfigurePipeline: null,
  isLoading: false,
  error: null,
});
