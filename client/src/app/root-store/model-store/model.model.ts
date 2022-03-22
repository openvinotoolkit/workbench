import { Dictionary } from '@ngrx/entity';

import { IAccuracyConfiguration, IVisualizationConfiguration } from '@shared/models/accuracy';
import { IAdapter } from '@shared/models/accuracy/adapter';
import { Artifact } from '@shared/models/artifact';

import { InputLayerConfig } from '../../modules/model-manager/components/model-manager-convert/input-output-layer-control/input-output-layer-control.component';
import { ProjectStatus } from '../project-store/project.model';

export enum ModelDomain {
  CV = 'CV',
  NLP = 'NLP',
}

export const modelDomainNames = {
  [ModelDomain.CV]: 'CV',
  [ModelDomain.NLP]: 'NLP',
};

export enum THROUGHPUT_UNIT {
  FPS = 'FPS',
  SPS = 'SPS',
}

export enum ModelTaskTypeNames {
  CLASSIFICATION = 'Classification',
  OBJECT_DETECTION = 'Object Detection',
  GENERIC = 'Generic',
  YOLO_V2 = 'Yolo V2',
  TINY_YOLO_V2 = 'Tiny Yolo V2',
  YOLO_V3 = 'Yolo V3',
  YOLO_V4 = 'Yolo V4',
  TINY_YOLO_V3_V4 = 'Tiny Yolo V3/V4',
  INSTANCE_SEGMENTATION = 'Instance Segmentation',
  SEMANTIC_SEGMENTATION = 'Semantic Segmentation',
  INPAINTING = 'Inpainting',
  STYLE_TRANSFER = 'Style Transfer',
  SUPER_RESOLUTION = 'Super-Resolution',
  FACE_RECOGNITION = 'Face Recognition',
  LANDMARK_DETECTION = 'Facial Landmark Detection',
  TEXT_CLASSIFICATION = 'Text Classification',
  TEXTUAL_ENTAILMENT = 'Textual Entailment',
  CUSTOM = 'Custom',
}

export enum ModelTaskTypes {
  CLASSIFICATION = 'classification',
  OBJECT_DETECTION = 'object_detection',
  INSTANCE_SEGMENTATION = 'instance_segmentation',
  SEMANTIC_SEGMENTATION = 'semantic_segmentation',
  GENERIC = 'generic',
  INPAINTING = 'inpainting',
  STYLE_TRANSFER = 'style_transfer',
  SUPER_RESOLUTION = 'super_resolution',
  FACE_RECOGNITION = 'face_recognition',
  LANDMARK_DETECTION = 'landmark_detection',
  TEXT_CLASSIFICATION = 'text_classification',
  TEXTUAL_ENTAILMENT = 'textual_entailment',
  CUSTOM = 'custom',
}

export type SupportedModelTaskType =
  | ModelTaskTypes.CLASSIFICATION
  | ModelTaskTypes.OBJECT_DETECTION
  | ModelTaskTypes.INSTANCE_SEGMENTATION
  | ModelTaskTypes.SEMANTIC_SEGMENTATION
  | ModelTaskTypes.INPAINTING
  | ModelTaskTypes.STYLE_TRANSFER
  | ModelTaskTypes.SUPER_RESOLUTION
  | ModelTaskTypes.FACE_RECOGNITION
  | ModelTaskTypes.LANDMARK_DETECTION
  | ModelTaskTypes.CUSTOM
  | ModelTaskTypes.TEXT_CLASSIFICATION
  | ModelTaskTypes.TEXTUAL_ENTAILMENT
  | ModelTaskTypes.GENERIC;

export const TaskTypeToNameMap = {
  [ModelTaskTypes.CLASSIFICATION]: ModelTaskTypeNames.CLASSIFICATION,
  [ModelTaskTypes.OBJECT_DETECTION]: ModelTaskTypeNames.OBJECT_DETECTION,
  [ModelTaskTypes.INSTANCE_SEGMENTATION]: ModelTaskTypeNames.INSTANCE_SEGMENTATION,
  [ModelTaskTypes.SEMANTIC_SEGMENTATION]: ModelTaskTypeNames.SEMANTIC_SEGMENTATION,
  [ModelTaskTypes.GENERIC]: ModelTaskTypeNames.GENERIC,
  [ModelTaskTypes.INPAINTING]: ModelTaskTypeNames.INPAINTING,
  [ModelTaskTypes.STYLE_TRANSFER]: ModelTaskTypeNames.STYLE_TRANSFER,
  [ModelTaskTypes.SUPER_RESOLUTION]: ModelTaskTypeNames.SUPER_RESOLUTION,
  [ModelTaskTypes.FACE_RECOGNITION]: ModelTaskTypeNames.FACE_RECOGNITION,
  [ModelTaskTypes.LANDMARK_DETECTION]: ModelTaskTypeNames.LANDMARK_DETECTION,
  [ModelTaskTypes.TEXT_CLASSIFICATION]: ModelTaskTypeNames.TEXT_CLASSIFICATION,
  [ModelTaskTypes.TEXTUAL_ENTAILMENT]: ModelTaskTypeNames.TEXTUAL_ENTAILMENT,
  [ModelTaskTypes.CUSTOM]: ModelTaskTypeNames.CUSTOM,
};

export enum ModelTaskMethods {
  CLASSIFICATOR = 'classificator',
  SSD = 'ssd',
  YOLO_V2 = 'yolo_v2',
  TINY_YOLO_V2 = 'tiny_yolo_v2',
  YOLO_V3 = 'yolo_v3',
  YOLO_V4 = 'yolo_v4',
  TINY_YOLO_V3_V4 = 'tiny_yolo_v3_v4',
  GENERIC = 'generic',
  GENERIC_YOLO = 'yolo',
  SEMANTIC_SEGMENTATION = 'segmentation',
  MASK_RCNN_SEGMENTATION = 'mask_rcnn',
  INPAINTING = 'inpainting',
  STYLE_TRANSFER = 'style_transfer',
  SUPER_RESOLUTION = 'super_resolution',
  FACE_RECOGNITION = 'face_recognition',
  LANDMARK_DETECTION = 'landmark_detection',
  CUSTOM = 'custom',
}

export const TaskMethodToNameMap = {
  [ModelTaskMethods.CLASSIFICATOR]: ModelTaskTypeNames.CLASSIFICATION,
  [ModelTaskMethods.SSD]: 'SSD',
  [ModelTaskMethods.GENERIC]: ModelTaskMethods.GENERIC,
  [ModelTaskMethods.YOLO_V2]: ModelTaskTypeNames.YOLO_V2,
  [ModelTaskMethods.GENERIC_YOLO]: ModelTaskTypeNames.YOLO_V2,
  [ModelTaskMethods.TINY_YOLO_V2]: ModelTaskTypeNames.TINY_YOLO_V2,
  [ModelTaskMethods.YOLO_V3]: ModelTaskTypeNames.YOLO_V3,
  [ModelTaskMethods.YOLO_V4]: ModelTaskTypeNames.YOLO_V4,
  [ModelTaskMethods.TINY_YOLO_V3_V4]: ModelTaskTypeNames.TINY_YOLO_V3_V4,
  [ModelTaskMethods.SEMANTIC_SEGMENTATION]: ModelTaskTypeNames.SEMANTIC_SEGMENTATION,
  [ModelTaskMethods.MASK_RCNN_SEGMENTATION]: ModelTaskTypeNames.INSTANCE_SEGMENTATION,
  [ModelTaskMethods.INPAINTING]: ModelTaskTypeNames.INPAINTING,
  [ModelTaskMethods.STYLE_TRANSFER]: ModelTaskTypeNames.STYLE_TRANSFER,
  [ModelTaskMethods.SUPER_RESOLUTION]: ModelTaskTypeNames.SUPER_RESOLUTION,
  [ModelTaskMethods.FACE_RECOGNITION]: ModelTaskTypeNames.FACE_RECOGNITION,
  [ModelTaskMethods.LANDMARK_DETECTION]: ModelTaskTypeNames.LANDMARK_DETECTION,
  [ModelTaskMethods.CUSTOM]: ModelTaskTypeNames.CUSTOM,
};

export const TaskMethodToTypeMap = {
  [ModelTaskMethods.CLASSIFICATOR]: ModelTaskTypes.CLASSIFICATION,
  [ModelTaskMethods.SSD]: ModelTaskTypes.OBJECT_DETECTION,
  [ModelTaskMethods.YOLO_V2]: ModelTaskTypes.OBJECT_DETECTION,
  [ModelTaskMethods.TINY_YOLO_V2]: ModelTaskTypes.OBJECT_DETECTION,
  [ModelTaskMethods.YOLO_V3]: ModelTaskTypes.OBJECT_DETECTION,
  [ModelTaskMethods.YOLO_V4]: ModelTaskTypes.OBJECT_DETECTION,
  [ModelTaskMethods.TINY_YOLO_V3_V4]: ModelTaskTypes.OBJECT_DETECTION,
  [ModelTaskMethods.GENERIC_YOLO]: ModelTaskTypes.OBJECT_DETECTION,
  [ModelTaskMethods.SEMANTIC_SEGMENTATION]: ModelTaskTypes.SEMANTIC_SEGMENTATION,
  [ModelTaskMethods.MASK_RCNN_SEGMENTATION]: ModelTaskTypes.INSTANCE_SEGMENTATION,
  [ModelTaskMethods.INPAINTING]: ModelTaskTypes.INPAINTING,
  [ModelTaskMethods.STYLE_TRANSFER]: ModelTaskTypes.STYLE_TRANSFER,
  [ModelTaskMethods.SUPER_RESOLUTION]: ModelTaskTypes.SUPER_RESOLUTION,
  [ModelTaskMethods.FACE_RECOGNITION]: ModelTaskTypes.FACE_RECOGNITION,
  [ModelTaskMethods.LANDMARK_DETECTION]: ModelTaskTypes.LANDMARK_DETECTION,
  [ModelTaskMethods.CUSTOM]: ModelTaskTypes.CUSTOM,
  [ModelTaskMethods.GENERIC]: ModelTaskTypes.GENERIC,
};

export enum ModelFrameworks {
  OPENVINO = 'openvino',
  CAFFE = 'caffe',
  CAFFE2 = 'caffe2',
  TF = 'tf',
  MXNET = 'mxnet',
  ONNX = 'onnx',
  PYTORCH = 'pytorch',
}

export type ModelFrameworksType =
  | ModelFrameworks.OPENVINO
  | ModelFrameworks.CAFFE
  | ModelFrameworks.CAFFE2
  | ModelFrameworks.MXNET
  | ModelFrameworks.ONNX
  | ModelFrameworks.PYTORCH
  | ModelFrameworks.TF;

export const modelFrameworkNamesMap = {
  [ModelFrameworks.OPENVINO]: 'OpenVINO IR',
  [ModelFrameworks.CAFFE]: 'Caffe',
  [ModelFrameworks.CAFFE2]: 'Caffe2',
  [ModelFrameworks.TF]: 'TensorFlow',
  [ModelFrameworks.MXNET]: 'MXNet',
  [ModelFrameworks.ONNX]: 'ONNX',
  [ModelFrameworks.PYTORCH]: 'PyTorch',
};

export enum OMZColumnNames {
  MODEL_NAME = 'name',
  PRECISION = 'precision',
  FRAMEWORK = 'framework',
  TASK_TYPE = 'taskType',
  DETAILS = 'details',
}

export enum OMZColumnLabels {
  MODEL_NAME = 'Model Name',
  PRECISION = 'Precision',
  FRAMEWORK = 'Framework',
  TASK_TYPE = 'Task Type',
  DETAILS = 'Details',
}

export interface ModelAnalysis {
  gFlops: number;
  gIops?: number;
  mParams: number;
  maximumMemory: number;
  minimumMemory: number;
  hasBackground: boolean | null;
  hasBatchnorm: boolean;
  isInt8: boolean;
  irVersion: string;
  isObsolete: boolean;
  topologySpecific: ITopologySpecificConfiguration;
  inputs: string[];
  outputs: string[];
  opSets?: string[];
  moParams?: ModelOptimizerParameters;
  numClasses: number;
  sparsity: number;
  topologyType: string;
}

export enum ModelPrecisionEnum {
  FP32 = 'FP32',
  I32 = 'I32',
  I64 = 'I64',
  FP16 = 'FP16',
  BF16 = 'BF16',
  I16 = 'I16',
  I8 = 'I8',
  U8 = 'U8',
  I4 = 'I4',
  U4 = 'U4',
  MIXED = 'MIXED',
  BOOL = 'BOOL',
  BIN = 'BIN',
}

export enum ModelColorChannels {
  RGB = 'RGB',
  BGR = 'BGR',
  Grayscale = 'Grayscale',
}

export const channelPrefixesMap = {
  RGB: ['R', 'G', 'B'],
  Grayscale: ['Gray'],
};

export enum ModelLayouts {
  NCHW = 'NCHW',
  NHWC = 'NHWC',
}

export type ModelPrecisionType =
  | ModelPrecisionEnum.FP32
  | ModelPrecisionEnum.I32
  | ModelPrecisionEnum.FP16
  | ModelPrecisionEnum.I16
  | ModelPrecisionEnum.I8
  | ModelPrecisionEnum.U8
  | ModelPrecisionEnum.MIXED;

export enum ShapeType {
  DYNAMIC = 'dynamic',
  STATIC = 'static',
}

export interface InputConfiguration {
  index: number;
  name: string;
  shape: number[];
  layout?: string[];
}

export interface ModelShape {
  shapeConfiguration: InputConfiguration[];
  type: ShapeType;
  isOriginal: boolean;
}

export interface ModelItem extends Artifact {
  analysis?: ModelAnalysis;
  accuracyConfiguration: IAccuracyConfiguration;
  visualizationConfiguration: IVisualizationConfiguration;
  stages?: ProjectStatus[]; // Statuses of each job
  bodyPrecisions: ModelPrecisionType[];
  modelSource: ModelSources;
  framework: ModelFrameworksType;
  domain: ModelDomain;
  originalModelFramework?: ModelFrameworksType;
  modelOptimizerJobId?: number;
  selectedTokenizerId?: number;
  mo?: ModelOptimizerData;
  originalOmzPrecision?: ModelPrecisionType;
  isDownloading: boolean;
  xmlContent?: string;
  filesPaths: string[];
  status: ProjectStatus;
  optimizedFromModelId: number;
  shapes: ModelShape[];
  isConfigured: boolean;
}

export enum ModelSources {
  IR = 'ir',
  ORIGINAL = 'original',
  OMZ = 'omz',
  HUGGINGFACE = 'huggingface',
}

export enum ModelGraphType {
  ORIGINAL = 'original',
  RUNTIME = 'runtime',
}

export enum TransformationsConfigType {
  PRECONFIGURED = 'PRECONFIGURED',
  CUSTOM = 'CUSTOM',
}

export const TransformationsConfigTypeNamesMap = {
  [TransformationsConfigType.PRECONFIGURED]: 'Predefined Configuration File',
  [TransformationsConfigType.CUSTOM]: 'Custom Configuration File',
};

export class FileInfo {
  name: string;
  size: number;

  constructor(file: File) {
    this.name = file.name;
    this.size = file.size;
  }
}

export interface TF2SavedModel {
  name: string;
  assets: File[] | FileInfo[];
  variables: File[] | FileInfo[];
  pbModel: File | FileInfo;
  size: number;
}

export interface UploadingModelDTO {
  modelName: string;
  framework?: ModelFrameworksType;
  files: Dictionary<File | File[] | FileInfo | FileInfo[]>;
}

export interface UploadingTF2SavedModelDTO {
  modelName: string;
  framework?: ModelFrameworksType;
  files: {
    savedModelDir: TF2SavedModel;
  };
}

export interface CreatedModelDTO {
  modelItem: ModelItem;
  files: Dictionary<number | number[]>;
}

export interface ModelConvertConfig {
  batch?: number;
  dataType?: ModelPrecisionEnum.FP32 | ModelPrecisionEnum.FP16;
  originalChannelsOrder?: ModelColorChannels.BGR | ModelColorChannels.RGB | ModelColorChannels.Grayscale;
  originalLayout?: ModelLayouts.NCHW | ModelLayouts.NHWC;
  inputs?: InputLayerConfig[];
  outputs?: string[];
  enableSsdGluoncv?: boolean;
  legacyMxnetModel?: boolean;
  predefinedTransformationsConfig?: string;
  customTransformationsConfig?: string;
  pipelineConfigFile?: string;
  isPipelineConfigPersisted?: boolean; // Used for persisting pipeline config file on edit convert settings
}

export interface TransformationsConfig {
  name: string;
  documentation: string;
  framework: string;
}

export interface ModelOptimizerData {
  params: ModelConvertConfig;
  errorMessage: string;
  availableTransformationsConfigs?: TransformationsConfig[];
  analyzedParams?: AnalyzedParams;
}

export enum TensorFlowFlavors {
  FASTER_RCNN = 'FasterRCNN',
  RFCN = 'RFCN',
  SSD = 'SSD',
  MASK_RCNN = 'MaskRCNN',
  YOLO_V2 = 'YOLOV2Full',
  YOLO_V2_TINY = 'YOLOV2Tiny',
  YOLO_V3 = 'YOLOV3Full',
  YOLO_V3_TINY = 'YOLOV3Tiny',
}

type TensorFlowFlavorsType =
  | TensorFlowFlavors.FASTER_RCNN
  | TensorFlowFlavors.RFCN
  | TensorFlowFlavors.SSD
  | TensorFlowFlavors.MASK_RCNN
  | TensorFlowFlavors.YOLO_V2
  | TensorFlowFlavors.YOLO_V2_TINY
  | TensorFlowFlavors.YOLO_V3
  | TensorFlowFlavors.YOLO_V3_TINY;

export const tfFlavorsToPrefixMap = {
  [TensorFlowFlavors.FASTER_RCNN]: 'faster_rcnn_',
  [TensorFlowFlavors.RFCN]: 'rfcn_',
  [TensorFlowFlavors.SSD]: 'ssd_',
  [TensorFlowFlavors.MASK_RCNN]: 'mask_rcnn_',
  [TensorFlowFlavors.YOLO_V2]: 'yolo_v2',
  [TensorFlowFlavors.YOLO_V2_TINY]: 'yolo_v2_tiny',
  [TensorFlowFlavors.YOLO_V3]: 'yolo_v3',
  [TensorFlowFlavors.YOLO_V3_TINY]: 'yolo_v3_tiny',
};

interface AnalyzedParams {
  inputs: {
    [inputName: string]: {
      shape: number[];
      data_type: null;
      value: null;
    };
  };
  intermediate?: string[];
  model_type?: {
    TF_OD_API: {
      flavor: TensorFlowFlavorsType;
      mandatory_parameters: string[][];
    };
  };
}

export interface ModelConvertConfigDTO extends ModelConvertConfig {
  modelOptimizerJobId?: number;
  // Need this ID for the case of conversion model from model downloader
  topologyId?: number;
}

export interface EditModelConvertConfigDTO extends ModelConvertConfig {
  irId: number;
}

export interface ModelOptimizerParameters {
  framework: ModelFrameworksType;
  dataType: ModelPrecisionType;
  batch: number;
  reverseInputChannels: boolean;
  input: string;
  inputShape: string;
  meanValues: string;
  scaleValues: string;
  output: string;
  transformationsConfig: string;
  // TensorFlow
  frozen: boolean;
  inputCheckpoint: string;
  inputMetaGraph: string;
  tensorflowObjectDetectionApiPipelineConfig: string;
  // MxNet
  legacyMxnetModel: boolean;
  enableSsdGluoncv: boolean;
}

export interface ModelArchivingSocketDTO {
  artifactId: number;
  modelId: number;
  path: string;
  name: string;
  tabId: string;
  status: { progress: number };
  config: { sessionId: string };
}

export interface ITopologySpecificConfiguration {
  segmentation: {
    use_argmax: boolean;
  };
  mask_rcnn: IAdapter;
}
