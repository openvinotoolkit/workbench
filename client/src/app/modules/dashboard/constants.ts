export enum COMPARISON_CHART_COLOR {
  FIRST_LINE = '#AE5F0E',
  DEFAULT_LINE = '#383838',
  FIRST_SELECTED_POINT = '#5307b7',
  SECOND_LINE = '#3A0F8B',
  SECOND_SELECTED_POINT = '#0A631A',
  SWEET_SPOT = '#FF0075',
  SWEET_SPOT_THRESHOLD_LINE = '#1738c6',
}

const selectedPointAImg = new Image();
selectedPointAImg.src = 'assets/svg/point-a.svg';
const selectedPointBImg = new Image();
selectedPointBImg.src = 'assets/svg/point-b.svg';
const defaultSweetSpotPointImg = new Image();
defaultSweetSpotPointImg.src = 'assets/svg/sweet-spot-point.svg';
const sweetSpotPointAImg = new Image();
sweetSpotPointAImg.src = 'assets/svg/sweet-spot-a.svg';
const sweetSpotPointBImg = new Image();
sweetSpotPointBImg.src = 'assets/svg/sweet-spot-b.svg';

export const POINT_STYLES = {
  POINT_A: selectedPointAImg,
  POINT_B: selectedPointBImg,
  SWEET_SPOT_POINT_DEFAULT: defaultSweetSpotPointImg,
  SWEET_SPOT_POINT_A: sweetSpotPointAImg,
  SWEET_SPOT_POINT_B: sweetSpotPointBImg,
};

export enum RATIO_BAR_COLOR_SCHEME_DEFAULT {
  CONVOLUTION = 329,
  REORDER = 357,
  DETECTIONOUTPUT = 45,
  SCALESHIFT = 0,
  SOFTMAX = 340,
  PERMUTE = 48,
  CONCAT = 283,
  FULLYCONNECTED = 187,
  POOLING = 183,
  RELU = 60,
  CROP = 338,
  NORM = 15,
  PRELU = 198,
  FLATTEN = 250,
  POWER = 0,
  CONCATENATION = 283, // DUPLICATED COLOR
  PSROIPOOLING = 51,
  ELTWISE = 25,
  PROPOSAL = 120,
  INTERP = 283,
  ARGMAX = 168,
  OUTPUT = 168,
  NORMALIZE = 17,
  TILE = 331,
  DEFAULT = 266,
}

export enum RATIO_BAR_COLOR_SCHEME_A {
  CONVOLUTION = 266,
  REORDER = 266,
  DETECTIONOUTPUT = 45,
  SCALESHIFT = 240,
  SOFTMAX = 300,
  PERMUTE = 54,
  CONCAT = 54,
  FULLYCONNECTED = 70,
  POOLING = 206,
  RELU = 300,
  CROP = 174,
  NORM = 70,
  PRELU = 342,
  FLATTEN = 342,
  POWER = 34,
  CONCATENATION = 54,
  PSROIPOOLING = 55,
  ELTWISE = 206,
  PROPOSAL = 266,
  INTERP = 266,
  ARGMAX = 45,
  OUTPUT = 240,
  NORMALIZE = 70,
  TILE = 300,
  DEFAULT = 266,
}

export enum RATIO_BAR_COLOR_SCHEME_B {
  CONVOLUTION = 192,
  REORDER = 191,
  DETECTIONOUTPUT = 84,
  SCALESHIFT = 136,
  SOFTMAX = 7,
  PERMUTE = 136,
  CONCAT = 30,
  FULLYCONNECTED = 135,
  POOLING = 7,
  RELU = 191,
  CROP = 7,
  NORM = 205,
  PRELU = 76,
  FLATTEN = 340,
  POWER = 54,
  CONCATENATION = 54,
  PSROIPOOLING = 192,
  ELTWISE = 84,
  PROPOSAL = 136,
  INTERP = 7,
  ARGMAX = 136,
  OUTPUT = 30,
  NORMALIZE = 135,
  TILE = 7,
  DEFAULT = 266,
}

export const taggedLayerNamesRegex = /[<>]/g;

export enum ANALYZE_RIBBON_IDS {
  PERFORMANCE = 'PERFORMANCE',
  ACCURACY = 'ACCURACY',
}

export enum ANALYZE_PERFORMANCE_RIBBON_IDS {
  PRECISION = 'precision',
  METRICS = 'metrics',
  KERNEL = 'KERNEL',
}

export enum PERFORM_RIBBON_IDS {
  OPTIMIZE = 'optimize',
  TUNE = 'tune',
  CREATE_ACCURACY_REPORT = 'CREATE_ACCURACY_REPORT',
  TEST = 'test',
  CREATE = 'create',
  EXPORT = 'export',
}

export enum LEARN_OPENVINO_RIBBON_IDS {
  GENERATED_TUTORIAL = 'GENERATED_TUTORIAL',
  SAMPLE_TUTORIAL = 'SAMPLE_TUTORIAL',
  OPENVINO_NOTEBOOKS = 'OPENVINO_NOTEBOOKS',
}

export enum CREATE_PROJECT_STAGES {
  MODEL = 'model',
  ENVIRONMENT = 'environment',
  DATASET = 'dataset',
}
