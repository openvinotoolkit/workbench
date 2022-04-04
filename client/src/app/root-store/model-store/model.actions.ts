import { createAction, props } from '@ngrx/store';
import { Update } from '@ngrx/entity';

import { ErrorState } from '@store/state';

import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';
import { UploadModelSocketDTO } from '@shared/models/dto/upload-socket-message-dto';
import { IAccuracyConfiguration } from '@shared/models/accuracy';
import { IConfigurePipeline } from '@shared/models/pipelines/configure-pipeline';
import { IHuggingfaceModel } from '@shared/models/huggingface/huggingface-model';

import {
  EditModelConvertConfigDTO,
  InputConfiguration,
  ModelArchivingSocketDTO,
  ModelConvertConfigDTO,
  ModelItem,
  TransformationsConfig,
  UploadingModelDTO,
  UploadingTF2SavedModelDTO,
} from './model.model';
import { OMZModelPrecisionEnum } from '../../modules/model-manager/components/omz-import-ribbon-content/omz-import-ribbon-content.component';

export const waitDownload = createAction('[Model] Fake download state');

export const startModelArchiving = createAction(
  '[Model] Start model download for archiving',
  props<{ modelId: number; isDerivative: boolean; name: string }>()
);

export const startModelArchivingSocket = createAction(
  '[Model] Archiving socket received',
  props<ModelArchivingSocketDTO>()
);

export const startModelDownload = createAction(
  '[Model] Start model download as a blob',
  props<{ artifactId: number; modelId: number; name: string }>()
);

export const startModelDownloadSuccess = createAction(
  '[Model] Finished model download as a blob',
  props<{ modelId: number }>()
);

export const loadModels = createAction('[Model] Load Models');

export const loadModelsSuccess = createAction('[Model] Load Models Success', props<{ items: ModelItem[] }>());

export const loadModelsFailure = createAction('[Model] Load Models Failure', props<{ error: ErrorState }>());

export const loadModelById = createAction('[Model] Load Model By Id', props<{ id: number }>());

export const loadModelByIdSuccess = createAction('[Model] Load Model By Id Success', props<{ modelItem: ModelItem }>());

export const refreshSelectedModel = createAction('[Model] Refresh Selected Model');

export const loadModelByIdFailure = createAction('[Model] Load Model By Id Failure', props<{ error: ErrorState }>());

export const loadSelectedModelById = createAction('[Model] Load Selected Model By Id', props<{ id: number }>());

export const loadSelectedModelByIdSuccess = createAction(
  '[Model] Load Selected Model By Id Success',
  props<{ modelItem: ModelItem }>()
);

export const loadSelectedModelByIdFailure = createAction(
  '[Model] Load Selected Model By Id Failure',
  props<{ error: ErrorState }>()
);

export const startUploadModel = createAction(
  '[Model] Start Upload Model',
  props<{ uploadingModel: UploadingModelDTO }>()
);

export const startUploadModelSuccess = createAction(
  '[Model] Start Upload Model Success',
  props<{ modelItem: ModelItem; fileId: number; file: File }>()
);

export const startUploadModelFailure = createAction(
  '[Model] Start Upload Model Failure',
  props<{ error: ErrorState }>()
);

export const startUploadModelDir = createAction(
  '[Model] Start Upload Model Directory',
  props<{ modelFolder: UploadingTF2SavedModelDTO }>()
);

export const convertModel = createAction('[Model] Convert Model', props<{ convertConfig: ModelConvertConfigDTO }>());

export const convertModelSuccess = createAction('[Model] Convert Model Success');

export const convertModelFailure = createAction('[Model] Convert Model Failure', props<{ error: ErrorState }>());

export const editModelConvert = createAction(
  '[Model] Edit Model Convert Config',
  props<{ editConvertConfig: EditModelConvertConfigDTO }>()
);

export const editModelConvertSuccess = createAction(
  '[Model] Edit Model Convert Config Success',
  props<{ modelId: number }>()
);

export const editModelConvertFailure = createAction(
  '[Model] Edit Model Convert Config Failure',
  props<{ error: ErrorState }>()
);

export const uploadModelSuccess = createAction('[Model] Upload Model Success', props<{ id: number }>());

export const uploadModelFailure = createAction(
  '[Model] Upload Models Failure',
  props<{ id: number; error: ErrorState }>()
);

export const updateModelItem = createAction('[Model] Update Model Item', props<Update<ModelItem>>());

export const onUploadModelSocket = createAction(
  '[Model] On Upload Socket Message Update',
  props<{ data: UploadModelSocketDTO }>()
);

export const resetImportingModel = createAction('[Model] Reset Importing Model');

export const removeModel = createAction('[Model] Remove Model', props<{ id: number }>());

export const removeModelSuccess = createAction('[Model] Remove Model Success', props<{ id: number }>());

export const removeModelFailure = createAction('[Model] Remove Model Failure', props<{ error: ErrorState }>());

export const cancelModelUpload = createAction('[Model] Cancel Upload', props<{ id: number }>());

export const cancelModelUploadSuccess = createAction('[Model] Cancel Upload Success', props<{ id: number }>());

export const cancelModelUploadFailure = createAction('[Model] Cancel Upload Failure', props<{ error: ErrorState }>());

export const loadOMZModels = createAction('[Model] Load OMZ Models');

export const loadOMZModelsSuccess = createAction(
  '[Model] Load OMZ Models Success',
  props<{ items: ModelDownloaderDTO[] }>()
);

export const loadOMZModelsFailure = createAction('[Model] Load OMZ Models Failure', props<{ error: ErrorState }>());

export const resetOMZModels = createAction('[Model] Reset OMZ Models');

export const downloadOMZModel = createAction(
  '[Model] Download OMZ Model',
  props<{ model: ModelDownloaderDTO; precision?: OMZModelPrecisionEnum }>()
);

export const downloadOMZModelSuccess = createAction(
  '[Model] Download OMZ Model Success',
  props<{ modelItem: ModelItem }>()
);

export const downloadOMZModelFailure = createAction(
  '[Model] Download OMZ Model Failure',
  props<{ error: ErrorState }>()
);

export const updateAccuracyConfig = createAction(
  '[Model] Update Model Accuracy Config',
  props<{
    modelId: number;
    projectId: number;
    data: IAccuracyConfiguration;
    deleteRawAccuracy?: boolean;
    onSuccess?: () => void;
  }>()
);

export const updateAccuracyConfigSuccess = createAction(
  '[Model] Update Model Accuracy Config Success',
  props<{ modelItem: ModelItem; onSuccess?: () => void }>()
);

export const updateAccuracyConfigFailure = createAction(
  '[Model] Update Model Accuracy Config Failure',
  props<{ error: ErrorState }>()
);

export const setAvailableModelTransformationsConfigs = createAction(
  '[Model] Set Available Model Transformations Configs',
  props<{ configs: TransformationsConfig[] }>()
);

export const resetModelMOAnalyzedParams = createAction(
  '[Model] Reset Model MO Analyzed Params',
  props<{ modelId: number }>()
);

export const onConfigureModelSocketMessage = createAction(
  '[Model] On Configure Socket Message Update',
  props<{ message: IConfigurePipeline }>()
);

export const configureModel = createAction(
  '[Model] Configure model',
  props<{ modelId: number; inputsConfigurations: InputConfiguration[] }>()
);

export const configureModelStartSuccess = createAction('[Model] Configure Model Start Success');

export const configureModelStartFailure = createAction(
  '[Model] Configure Model Start Failure',
  props<{ error: ErrorState }>()
);

export const setConfigurePipeline = createAction(
  '[Model] Set Configure Pipeline',
  props<{ data: IConfigurePipeline }>()
);

export const removeConfigurePipeline = createAction('[Model] Remove Configure Pipeline');

export const configureFailure = createAction('[Model] Configure Failure', props<{ error: string }>());

export const configureModelSuccess = createAction('[Model] Configure Model Success', props<{ modelId: number }>());

export const importHuggingfaceModel = createAction(
  '[Model] Import huggingface model',
  props<{ huggingfaceModel: IHuggingfaceModel }>()
);

export const importHuggingfaceModelSuccess = createAction(
  '[Model] Import huggingface model Success',
  props<{ model: ModelItem }>()
);

export const importHuggingfaceModelFailure = createAction(
  '[Model] Import huggingface model Failure',
  props<{ error: ErrorState }>()
);
