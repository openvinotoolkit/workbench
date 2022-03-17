import { ProjectStatus } from '@store/project-store/project.model';
import { SupportedDatasetType } from '@store/dataset-store/dataset.model';
import {
  ModelAnalysis,
  ModelOptimizerData,
  ModelTaskMethods,
  ModelPrecisionType,
  SupportedModelTaskType,
} from '@store/model-store/model.model';

export enum FileTypeEnum {
  MODEL = 'model',
  DATASET = 'dataset',
}

export type FileType = FileTypeEnum.MODEL | FileTypeEnum.DATASET;

export interface UploadSocketDTO {
  id: number;
  sessionId: string;
  creationTimestamp: number;
  date: number;
  fileType: FileType;
  name: string;
  size: number | null;
  status: ProjectStatus;
}

export interface UploadModelSocketDTO extends UploadSocketDTO {
  fileType: FileTypeEnum.MODEL;
  type: ModelTaskMethods.CLASSIFICATOR | ModelTaskMethods.SSD | ModelTaskMethods.GENERIC;
  mo?: ModelOptimizerData;
  analysis?: ModelAnalysis;
  bodyPrecisions?: ModelPrecisionType[];
  stages?: ProjectStatus[]; // Statuses of each chained job
}

export interface UploadDatasetSocketDTO extends UploadSocketDTO {
  fileType: FileTypeEnum.DATASET;
  type: SupportedDatasetType;
  originalType: SupportedDatasetType;
  tasks: SupportedModelTaskType[];
  labelsNumber: number;
  maxLabelId: number;
  numberOfImages: number;
  singleImagePath?: string;
  csvFilePath?: string;
}
