import { ProjectStatus } from '@store/project-store/project.model';

import { Artifact } from '@shared/models/artifact';

import { SupportedModelTaskType } from './../model-store/model.model';
import { FileInfo } from '../model-store/model.model';
import { ITextDatasetSettings } from '../../modules/dataset-manager/pages/import-text-dataset-page/text-dataset-settings.model';

export enum DatasetTypes {
  VOC = 'voc',
  COCO = 'coco',
  IMAGE_NET = 'imagenet',
  IMAGE_NET_TXT = 'imagenet_txt',
  COMMON_SEMANTIC_SEGMENTATION = 'common_semantic_segmentation',
  COMMON_SUPER_RESOLUTION = 'common_super_resolution',
  LFW = 'lfw',
  VGG_FACE_2 = 'vgg_face2',
  WIDER_FACE = 'wider_face',
  OPEN_IMAGES = 'open_images',
  CSV = 'csv',
  CITYSCAPES = 'cityscapes',
  NOT_ANNOTATED = 'not_annotated',
}

export type SupportedDatasetType =
  | DatasetTypes.VOC
  | DatasetTypes.IMAGE_NET_TXT
  | DatasetTypes.COCO
  | DatasetTypes.COMMON_SEMANTIC_SEGMENTATION
  | DatasetTypes.COMMON_SUPER_RESOLUTION
  | DatasetTypes.LFW
  | DatasetTypes.VGG_FACE_2
  | DatasetTypes.WIDER_FACE
  | DatasetTypes.OPEN_IMAGES
  | DatasetTypes.CSV
  | DatasetTypes.NOT_ANNOTATED;

export enum DatasetTypeNames {
  VOC = 'VOC',
  COCO = 'COCO',
  IMAGE_NET = 'ImageNet (Train)',
  IMAGE_NET_TXT = 'ImageNet',
  COMMON_SEMANTIC_SEGMENTATION = 'Common Semantic Segmentation',
  COMMON_SUPER_RESOLUTION = 'Common Super-Resolution',
  LFW = 'LFW',
  VGG_FACE_2 = 'VggFace2',
  WIDER_FACE = 'WIDER FACE',
  OPEN_IMAGES = 'Open Images',
  CITYSCAPES = 'Cityscapes',
  CSV = 'CSV',
  NOT_ANNOTATED = 'Not Annotated',
}

export const DatasetTypeToNameMap = {
  [DatasetTypes.VOC]: DatasetTypeNames.VOC,
  [DatasetTypes.COCO]: DatasetTypeNames.COCO,
  [DatasetTypes.IMAGE_NET]: DatasetTypeNames.IMAGE_NET,
  [DatasetTypes.IMAGE_NET_TXT]: DatasetTypeNames.IMAGE_NET_TXT,
  [DatasetTypes.COMMON_SEMANTIC_SEGMENTATION]: DatasetTypeNames.COMMON_SEMANTIC_SEGMENTATION,
  [DatasetTypes.COMMON_SUPER_RESOLUTION]: DatasetTypeNames.COMMON_SUPER_RESOLUTION,
  [DatasetTypes.LFW]: DatasetTypeNames.LFW,
  [DatasetTypes.VGG_FACE_2]: DatasetTypeNames.VGG_FACE_2,
  [DatasetTypes.WIDER_FACE]: DatasetTypeNames.WIDER_FACE,
  [DatasetTypes.OPEN_IMAGES]: DatasetTypeNames.OPEN_IMAGES,
  [DatasetTypes.CSV]: DatasetTypeNames.CSV,
  [DatasetTypes.CITYSCAPES]: DatasetTypeNames.CITYSCAPES,
  [DatasetTypes.NOT_ANNOTATED]: DatasetTypeNames.NOT_ANNOTATED,
};

export interface IUploadingImage {
  id: number;
  name: string;
  src: string;
}

export interface DatasetItem extends Artifact {
  type: SupportedDatasetType;
  originalType: SupportedDatasetType;
  name: string;
  tasks: SupportedModelTaskType[];
  labelsNumber: number;
  maxLabelId: number;
  numberOfImages: number;
  singleImagePath?: string;
  csvFilePath?: string;
  status: ProjectStatus;
}

export interface UploadingDatasetDTO {
  datasetName: string;
  datasetType: DatasetTypes | 'autodetect';
  files: {
    datasetArchive: File | FileInfo;
  };
}

export interface UploadingTextDatasetDTO extends UploadingDatasetDTO {
  settings: ITextDatasetSettings;
}

export interface NADatasetDTO {
  datasetName: string;
  images: File[] | FileInfo[];
  augmentationConfig: DatasetAugmentationDTO;
}

export interface CreatedDatasetDTO {
  datasetItem: DatasetItem;
  files: {
    datasetArchive: number;
  };
}

export interface IImageCorrection {
  id: string;
  name: string;
  brightness: number;
  contrast: number;
}

export interface DatasetAugmentationDTO {
  applyHorizontalFlip: boolean;
  applyVerticalFlip: boolean;
  applyErase: boolean;
  eraseImages: number;
  eraseRatio: number;
  applyNoise: boolean;
  noiseImages: number;
  noiseRatio: number;
  applyImageCorrections: boolean;
  imageCorrections: IImageCorrection[];
}

export const initialAugmentationFormState: DatasetAugmentationDTO = {
  applyHorizontalFlip: false,
  applyVerticalFlip: false,
  applyErase: false,
  eraseImages: 0,
  eraseRatio: 0,
  applyNoise: false,
  noiseImages: 0,
  noiseRatio: 0,
  applyImageCorrections: false,
  imageCorrections: [],
};
