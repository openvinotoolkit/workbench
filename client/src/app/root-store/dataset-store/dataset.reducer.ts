import { createReducer, on } from '@ngrx/store';

import * as DatasetActions from './dataset.actions';
import { datasetItemAdapter, initialState } from './dataset.state';
import { ProjectStatusNames } from '../project-store/project.model';

export const reducer = createReducer(
  initialState,

  on(DatasetActions.loadDatasets, (state) => ({ ...state, isLoading: true, error: null })),
  on(DatasetActions.loadDatasetsSuccess, (state, { items }) =>
    datasetItemAdapter.setAll(items, {
      ...state,
      isLoading: false,
      error: null,
    })
  ),
  on(DatasetActions.loadDatasetsFailure, (state, { error }) => ({ ...state, isLoading: false, error })),

  on(DatasetActions.startUploadDatasetSuccess, (state, { dataset }) => {
    dataset.status.name = ProjectStatusNames.RUNNING;
    return datasetItemAdapter.addOne(dataset, {
      ...state,
      uploadingIds: [...state.uploadingIds, Number(dataset.id)],
    });
  }),

  on(DatasetActions.createNADatasetSuccess, (state, { dataset }) => {
    dataset.status.name = ProjectStatusNames.RUNNING;
    return datasetItemAdapter.addOne(dataset, {
      ...state,
      uploadingIds: [...state.uploadingIds, dataset.id],
    });
  }),

  on(DatasetActions.uploadDatasetFailure, (state, { id, error }) => ({
    ...state,
    isLoading: false,
    error,
    uploadingIds: state.uploadingIds.filter((datasetId) => datasetId !== id),
  })),

  on(DatasetActions.updateDatasetUploadPercent, (state, { data }) => {
    const {
      id,
      status,
      type,
      size,
      tasks,
      labelsNumber,
      maxLabelId,
      numberOfImages,
      singleImagePath,
      csvFilePath,
    } = data;

    const uploadingIds =
      status.name !== ProjectStatusNames.RUNNING
        ? state.uploadingIds.filter((datasetId) => datasetId !== Number(data.id))
        : state.uploadingIds;

    return datasetItemAdapter.updateOne(
      {
        id,
        changes: {
          status,
          type,
          size,
          tasks,
          labelsNumber,
          maxLabelId,
          numberOfImages,
          singleImagePath,
          csvFilePath,
        },
      },
      { ...state, uploadingIds }
    );
  }),

  on(DatasetActions.removeDatasetSuccess, (state, { id }) => datasetItemAdapter.removeOne(id, state)),

  on(DatasetActions.cancelDatasetUploadSuccess, (state, { id }) =>
    datasetItemAdapter.updateOne(
      {
        id,
        changes: {
          status: {
            progress: 0,
            name: ProjectStatusNames.CANCELLED,
          },
        },
      },
      {
        ...state,
        uploadingIds: state.uploadingIds.filter((datasetId) => datasetId !== id),
      }
    )
  ),

  on(DatasetActions.loadDefaultImagesSuccess, (state, { blobs }) => ({
    ...state,
    defaultDatasetImages: blobs,
  })),

  on(DatasetActions.cleanDefaultImage, (state) => ({
    ...state,
    defaultDatasetImages: null,
  })),

  on(DatasetActions.loadDatasetsFailure, (state, { error }) => ({ ...state, error }))
);
