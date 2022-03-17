import { createAction, props } from '@ngrx/store';

import { ErrorState } from '@store/state';

import { UploadDatasetSocketDTO } from '@shared/models/dto/upload-socket-message-dto';

import { DatasetItem, NADatasetDTO, UploadingDatasetDTO, UploadingTextDatasetDTO } from './dataset.model';

export const loadDatasets = createAction('[Dataset] Load Datasets');

export const loadDatasetsSuccess = createAction('[Dataset] Load Datasets Success', props<{ items: DatasetItem[] }>());

export const loadDatasetsFailure = createAction('[Dataset] Load Datasets Failure', props<{ error: ErrorState }>());

export const loadDefaultImages = createAction('[Dataset] Load Default Images', props<{ isDevCloud: boolean }>());

export const loadDefaultImagesSuccess = createAction(
  '[Dataset] Load Default Images Success',
  props<{ blobs: Blob[] }>()
);

export const loadDefaultImagesFailure = createAction(
  '[Dataset] Load Default Images Failure',
  props<{ error: ErrorState }>()
);

export const createNADataset = createAction('[Dataset] Create NA Dataset', props<{ dataset: NADatasetDTO }>());

export const createNADatasetSuccess = createAction(
  '[Dataset] Create NA Dataset Success',
  props<{ dataset: DatasetItem; fileId: number; file: File }>()
);

export const createNADatasetFailure = createAction(
  '[Dataset] Create NA Dataset Failure',
  props<{ error: ErrorState }>()
);

export const startUploadDataset = createAction(
  '[Dataset] Start Upload Dataset',
  props<{ dataset: UploadingDatasetDTO | UploadingTextDatasetDTO }>()
);

export const startUploadDatasetSuccess = createAction(
  '[Dataset] Start Upload Dataset Success',
  props<{ dataset: DatasetItem; fileId: number; file: File }>()
);

export const startUploadDatasetFailure = createAction(
  '[Dataset] Start Upload Dataset Failure',
  props<{ error: ErrorState }>()
);

export const uploadDatasetSuccess = createAction('[Dataset] Upload Dataset Success', props<{ id: number }>());

export const uploadDatasetFailure = createAction(
  '[Dataset] Upload Dataset Failure',
  props<{ id: number; error: ErrorState }>()
);

export const updateDatasetUploadPercent = createAction(
  '[Dataset] Update Upload Percent',
  props<{ data: UploadDatasetSocketDTO }>()
);

export const onUploadDatasetSocket = createAction(
  '[Dataset] On Upload Socket Message Update',
  props<{ data: UploadDatasetSocketDTO }>()
);

export const removeDataset = createAction('[Dataset] Remove Dataset', props<{ id: number }>());

export const removeDatasetSuccess = createAction('[Dataset] Remove Dataset Success', props<{ id: number }>());

export const removeDatasetFailure = createAction('[Dataset] Remove Dataset Failure', props<{ error: ErrorState }>());

export const cancelDatasetUpload = createAction('[Dataset] Cancel Upload', props<{ id: number }>());

export const cancelDatasetUploadSuccess = createAction('[Dataset] Cancel Upload Success', props<{ id: number }>());

export const cancelDatasetUploadFailure = createAction(
  '[Dataset] Cancel Upload Failure',
  props<{ error: ErrorState }>()
);

export const cleanDefaultImage = createAction('[Dataset] Clean Default Image');
