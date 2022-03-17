import { ModelTaskTypes } from './../model-store/model.model';
import { DatasetStoreSelectors, DatasetStoreState } from './';
import { ProjectStatusNames } from '../project-store/project.model';
import { DatasetItem, DatasetTypes } from './dataset.model';

const id_1 = '1';
const id_2 = '2';

const name_1 = 'Dataset Name 1';
const name_2 = 'Dataset Name 2';

export const mockDatasetItemCommonFields: Partial<DatasetItem> = {
  date: 1557233659.602254,
  path: '/path/to/datasets/id',
  status: {
    name: ProjectStatusNames.READY,
    progress: 100,
  },
  size: 8,
  type: DatasetTypes.VOC,
  tasks: [ModelTaskTypes.OBJECT_DETECTION],
  labelsNumber: 0,
  maxLabelId: 0,
  numberOfImages: 10,
  singleImagePath: '/path/to/datasets/id/01.jpg',
};

const mockDatasetState = {
  ids: [id_1, id_2],
  entities: {
    [id_1]: {
      id: id_1,
      name: name_1,
      ...mockDatasetItemCommonFields,
    },
    [id_2]: {
      id: id_2,
      name: name_2,
      ...mockDatasetItemCommonFields,
    },
  },
  isLoading: false,
  error: null,
  uploadingIds: [],
  defaultDatasetImages: null,
} as DatasetStoreState.State;

describe('Dataset Selectors', () => {
  it('should select id to names map', () => {
    const { entities } = mockDatasetState;
    const result = { [id_1]: name_1, [id_2]: name_2 };
    expect(DatasetStoreSelectors.selectDatasetIdToNameMap.projector(entities)).toEqual(result);
  });

  it('should select item by id', () => {
    const { entities } = mockDatasetState;
    const expectedEntity = entities[id_1];
    expect(DatasetStoreSelectors.selectDatasetById.projector(entities, id_1)).toEqual(expectedEntity);
  });
});
