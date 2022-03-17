export enum MetricType {
  ACCURACY = 'accuracy',
  MAP = 'map',
  COCO_PRECISION = 'coco_precision',
  COCO_ORIG_SEGM_PRECISION = 'coco_orig_segm_precision',
  MEAN_IOU = 'mean_iou',
  PSNR = 'psnr',
  SSIM = 'ssim',
  NORMED_ERROR = 'normed_error',
  PAIRWISE_ACCURACY_SUBSETS = 'pairwise_accuracy_subsets',
}

export type IMetric =
  | IAccuracyMetric
  | IMapMetric
  | ICocoPrecisionMetric
  | ICocoOrigPrecisionMetric
  | IMeanIOUMetric
  | IPSNRMetric
  | ISSIMMetric
  | INormedErrorMetric
  | IPairwiseAccuracySubsetsMetric;

export interface IAccuracyMetric {
  type: MetricType.ACCURACY;
  top_k: number;
  presenter: 'print_vector';
}

export interface IMapMetric {
  type: MetricType.MAP;
  integral: '11point' | 'max';
  overlap_threshold: number;
  presenter: 'print_vector';
}

export interface ICocoPrecisionMetric {
  type: MetricType.COCO_PRECISION;
  max_detections: number;
  presenter: 'print_vector';
}

export interface ICocoOrigPrecisionMetric {
  type: MetricType.COCO_ORIG_SEGM_PRECISION;
  threshold?: string;
  presenter: 'print_vector';
}

export interface IMeanIOUMetric {
  type: MetricType.MEAN_IOU;
  use_argmax: boolean;
  presenter: 'print_vector';
}

export interface IPSNRMetric {
  type: MetricType.PSNR;
  presenter: 'print_vector';
}

export interface ISSIMMetric {
  type: MetricType.SSIM;
  presenter: 'print_vector';
}

export interface INormedErrorMetric {
  type: MetricType.NORMED_ERROR;
}

export interface IPairwiseAccuracySubsetsMetric {
  type: MetricType.PAIRWISE_ACCURACY_SUBSETS;
  subset_number: number;
}
