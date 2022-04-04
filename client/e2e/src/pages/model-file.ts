import { OMZModelPrecisionEnum } from '../../../src/app/modules/model-manager/components/omz-import-ribbon-content/omz-import-ribbon-content.component';

export type FrameworkType = 'OpenVINO IR' | 'MxNet' | 'Caffe' | 'ONNX' | 'TensorFlow' | 'TensorFlow V2';
export type ColorSpace = 'RGB' | 'BGR' | 'Grayscale';
export type ModelFile =
  | OpenVINOIRModel
  | CaffeModel
  | MxNetModel
  | OnnxModel
  | TensorFlowModel
  | TensorFlowV2
  | HFModel;
export type OriginalLayoutType = 'NCHW' | 'NHWC' | 'NC' | 'CN' | 'Other' | string[];

interface BasicModel {
  name?: string;
  type: 'model';
  isOMZ?: boolean;
  domain?: 'NLP' | 'CV';
  conversionSettings?: ConversionSettings;
  accuracyData?: Partial<AccuracyData>;
  backendData?: BackendData;
  custom?: {
    frozen: boolean;
  };
  validateTheoreticalAnalysis?: boolean;
  ValidateSettings?: boolean;
  tokenizer?: Tokenizer;
}

interface AccuracyData {
  accuracyValue: number;
  adapter: Partial<Adapter>;
  preProcessing: Partial<PreProcessing>;
  postProcessing: Partial<PostProcessing>;
  metric: Metric;
  inverseMask: boolean;
}

interface Adapter {
  taskType:
    | 'Object Detection'
    | 'Semantic Segmentation'
    | 'Instance Segmentation'
    | 'Classification'
    | 'Face Recognition'
    | 'Landmark Detection'
    | 'Super-Resolution'
    | 'Inpainting'
    | 'Style Transfer';
  subType: 'SSD' | 'Yolo V2' | 'Tiny Yolo V2' | 'Yolo V3' | 'Tiny Yolo V3/V4' | 'Yolo V4';
}

interface PreProcessing {
  resizeType: 'Auto';
  colourSpace: ColorSpace;
  hasBackground: 'Yes' | 'No';
  mapping: '91 COCO classes';
}

interface PostProcessing {
  resizeBoxes: 'ResizeBoxes' | 'ResizeBoxes NMS';
  NMSOverlap: number;
}

interface Metric {
  name: 'mAP' | 'COCO Precision' | 'Accuracy';
  integral: '11 Point';
  overlapThreshold: number;
  maxDetections: number;
  topK: number;
}

interface BackendData {
  data: number[];
}

interface Tokenizer {
  name: string;
  vocabPath: string;
}

interface ConversionSettings {
  colourSpace?: ColorSpace;
  precision?: OMZModelPrecisionEnum;
  framework: FrameworkType;
  outputs: string[];
  irVersion: number;
  irColourSpace: ColorSpace;
  opSets: string;
  dynamic?: boolean;
  setLayout?: boolean;
  inputLayers: {
    name?: string;
    type?: string;
    freezePlaceholder?: string;
    originalLayout?: OriginalLayoutType;
    shape?: number[];
    means?: number[];
    scales?: number[];
    validate?: boolean;
  }[];
}

export interface OpenVINOIRModel extends BasicModel {
  binPath: string;
  xmlPath: string;
  conversionSettings: {
    framework: 'OpenVINO IR';
  } & ConversionSettings;
}
export interface CaffeModel extends BasicModel {
  modelPath: string;
  protoTxtPath: string;
  conversionSettings: {
    framework: 'Caffe';
  } & ConversionSettings;
}
export interface MxNetModel extends BasicModel {
  paramsPath: string;
  jsonPath: string;
  conversionSettings: {
    framework: 'MxNet';
    legacy: boolean;
    gluoncv: boolean;
    preConfiguredConfigurationFile: string;
  } & ConversionSettings;
}
export interface OnnxModel extends BasicModel {
  onnxPath: string;
  conversionSettings: {
    framework: 'ONNX';
  } & ConversionSettings;
}
interface TensorFlowModel extends BasicModel {
  frozenPath: string;
  dataPath?: string;
  indexPath?: string;
  metaPath?: string;
  configPath?: string;
  conversionSettings: {
    framework: 'TensorFlow';
    frozen: boolean;
    modelTransformationsConfig: string;
    modelTransformationsConfigFullPath: string;
    transformationsConfig: string;
    transformationsConfigPath: string;
    preConfiguredConfigurationFile: string;
    ODAPI: boolean;
    pipelineConfig: 'pipeline' | 'pipeline.config';
    originalLayout: 'NHWC' | 'NCHW';
  } & ConversionSettings;
}
type TensorFlowV2 = TensorFlowV2H5Model | TensorFlowV2DirModel;
export interface TensorFlowV2H5Model extends BasicModel {
  h5path: string;
  configPath?: string;
  conversionSettings: {
    framework: 'TensorFlow V2';
    usePipelineConfig?: boolean;
  } & ConversionSettings;
}
export interface TensorFlowV2DirModel extends BasicModel {
  savedModelDir: string;
  configPath?: string;
  conversionSettings: {
    framework: 'TensorFlow V2';
    usePipelineConfig?: boolean;
  } & ConversionSettings;
}

export interface HFModel extends BasicModel {
  // Only supported now
  task: 'text-classification';
  // E.g., bert, electra, etc.
  architecture: string;
  languages?: string[];
  license?: string;
}

export const isTensorFlowModel = (model: ModelFile): model is TensorFlowModel => {
  return model.conversionSettings.framework === 'TensorFlow';
};
export const isMXNetModel = (model: ModelFile): model is MxNetModel => {
  return model.conversionSettings.framework === 'MxNet';
};
export const isTensorFlowV2Model = (model: ModelFile): model is TensorFlowV2 => {
  return model.conversionSettings.framework === 'TensorFlow V2';
};
