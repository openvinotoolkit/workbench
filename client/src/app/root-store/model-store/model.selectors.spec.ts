import { IAccuracyConfiguration, IVisualizationConfiguration } from '@shared/models/accuracy';

import { ModelStoreSelectors, ModelStoreState } from './';
import { ProjectStatusNames } from '../project-store/project.model';
import { ModelFrameworks, ModelItem, ModelPrecisionEnum, ModelSources } from './model.model';

const id_1 = 1;
const id_2 = 2;

const name_1 = 'Model Name 1';
const name_2 = 'Model Name 2';

const mockModelCommonFields: Partial<ModelItem> = {
  date: 1557233659.602254,
  path: '/path/to/models/id',
  isDownloading: false,
  bodyPrecisions: [ModelPrecisionEnum.FP32],
  status: {
    name: ProjectStatusNames.READY,
    progress: 100,
  },
  size: 34,
  accuracyConfiguration: {} as IAccuracyConfiguration,
  visualizationConfiguration: {} as IVisualizationConfiguration,
  modelSource: ModelSources.IR,
  framework: ModelFrameworks.OPENVINO,
  filesPaths: ['/path/to/models/id/file.xml', '/path/to/models/id/file.bin'],
  optimizedFromModelId: null,
};

const mockModelState = {
  ids: [id_1, id_2],
  entities: {
    [id_1]: {
      id: id_1,
      name: name_1,
      ...mockModelCommonFields,
    },
    [id_2]: {
      id: id_2,
      name: name_2,
      ...mockModelCommonFields,
    },
  },
  omzModels: {
    ids: [],
    entities: {},
    isLoading: false,
    error: null,
  },
  selectedModel: null,
  importingModelId: null,
  accuracyConfigSavePending: false,
  availableTransformationsConfigs: null,
  isLoading: false,
  error: null,
  uploadingIds: [],
  runningConfigurePipeline: null,
} as ModelStoreState.State;

describe('Model Selectors', () => {
  it('should select id to names map', () => {
    const { entities } = mockModelState;
    const result = { [id_1]: name_1, [id_2]: name_2 };
    expect(ModelStoreSelectors.selectModelIdToNameMap.projector(entities)).toEqual(result);
  });

  it('should select item by id', () => {
    const { entities } = mockModelState;
    const expectedEntity = entities[id_1];
    expect(ModelStoreSelectors.selectModelById.projector(entities, null, id_1)).toEqual(expectedEntity);
  });
});
