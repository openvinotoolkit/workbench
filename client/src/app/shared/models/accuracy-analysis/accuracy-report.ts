import { ModelTaskTypes } from '@store/model-store/model.model';

export enum AccuracyReportType {
  DATASET_ANNOTATIONS = 'dataset_annotations',
  PARENT_MODEL_PREDICTIONS = 'parent_model_predictions',
  PARENT_MODEL_PER_TENSOR = 'parent_model_per_tensor',
}

export interface IAccuracyReport {
  id: number;
  reportType: AccuracyReportType;
  taskType: ModelTaskTypes;
  metricType: string;
  metricName: string;
  accuracyResult: number;
  accuracyPostfix: string;
  projectId: number;
  targetDatasetId: number;
}

export interface IAccuracyTensorDistanceReport extends IAccuracyReport {
  outputNames: string[];
}

type BBox = [x_min: number, y_min: number, x_max: number, y_max: number];

export enum DetectionReportEntityKey {
  ID = 'id',
  REPORT_ID = 'report_id',
  IMAGE_NAME = 'image_name',
  CLASS_ID = 'class_id',
  PRECISION = 'precision',
  AP_PRECISION = 'ap_precision',
  ANNOTATIONS_COUNT = 'annotations_count',
  ANNOTATIONS = 'annotations',
  PREDICTIONS_COUNT = 'predictions_count',
  PREDICTIONS = 'predictions',
  MATCHES = 'matches',
  TOTAL_PREDICTIONS = 'total_predictions',
}

export interface IDetectionReportEntity {
  [DetectionReportEntityKey.ID]: number;
  [DetectionReportEntityKey.REPORT_ID]: number;
  [DetectionReportEntityKey.IMAGE_NAME]: string;
  [DetectionReportEntityKey.CLASS_ID]: number;
  [DetectionReportEntityKey.PRECISION]: number;
  [DetectionReportEntityKey.AP_PRECISION]: number;
  [DetectionReportEntityKey.ANNOTATIONS_COUNT]: number;
  [DetectionReportEntityKey.ANNOTATIONS]: BBox[];
  [DetectionReportEntityKey.PREDICTIONS_COUNT]: number;
  [DetectionReportEntityKey.PREDICTIONS]: { bbox: BBox; score: number }[];
  [DetectionReportEntityKey.MATCHES]: number;
  [DetectionReportEntityKey.TOTAL_PREDICTIONS]: number;
}

export interface IAggregatedDetectionReportEntity {
  [DetectionReportEntityKey.REPORT_ID]: number;
  [DetectionReportEntityKey.IMAGE_NAME]: string;
  class_ids: number;
  [DetectionReportEntityKey.ANNOTATIONS_COUNT]: number;
  [DetectionReportEntityKey.PREDICTIONS_COUNT]: number;
  [DetectionReportEntityKey.MATCHES]: number;
}

export enum ClassificationReportEntityKey {
  ID = 'id',
  REPORT_ID = 'report_id',
  IMAGE_NAME = 'image_name',
  ANNOTATION_CLASS_ID = 'annotation_class_id',
  TOP_K_PREDICTIONS = 'top_k_predictions',
  CONFIDENCE_IN_ANNOTATION_CLASS_ID = 'confidence_in_annotation_class_id',
  ANNOTATION_ID_RANK_IN_PREDICTIONS = 'annotation_id_rank_in_predictions',
  TOP_1_PREDICTION = 'top_1_prediction',
  TOP_1_PREDICTION_CONFIDENCE = 'top_1_prediction_confidence',
}

export interface IClassificationReportEntity {
  [ClassificationReportEntityKey.ID]: number;
  [ClassificationReportEntityKey.REPORT_ID]: number;
  [ClassificationReportEntityKey.IMAGE_NAME]: string;
  [ClassificationReportEntityKey.ANNOTATION_CLASS_ID]: number;
  [ClassificationReportEntityKey.TOP_K_PREDICTIONS]: { category_id: number; score: number }[];
  [ClassificationReportEntityKey.CONFIDENCE_IN_ANNOTATION_CLASS_ID]: number;
  [ClassificationReportEntityKey.ANNOTATION_ID_RANK_IN_PREDICTIONS]: number;
  [ClassificationReportEntityKey.TOP_1_PREDICTION]: number;
  [ClassificationReportEntityKey.TOP_1_PREDICTION_CONFIDENCE]: number;
}

export enum TensorDistanceReportEntityKey {
  ID = 'id',
  REPORT_ID = 'report_id',
  IMAGE_NAME = 'image_name',
  OUTPUT_NAME = 'output_name',
  MSE = 'mse',
}

export interface ITensorDistanceReportEntity {
  [TensorDistanceReportEntityKey.ID]: number;
  [TensorDistanceReportEntityKey.REPORT_ID]: number;
  [TensorDistanceReportEntityKey.IMAGE_NAME]: string;
  [TensorDistanceReportEntityKey.OUTPUT_NAME]: string;
  [TensorDistanceReportEntityKey.MSE]: number;
}

export type IOutputMSEInfo = Pick<
  ITensorDistanceReportEntity,
  TensorDistanceReportEntityKey.OUTPUT_NAME | TensorDistanceReportEntityKey.MSE
>;

export type AccuracyReportTableColumnHeaders<ReportEntityKey extends string> = Partial<
  Record<
    ReportEntityKey,
    Record<AccuracyReportType.DATASET_ANNOTATIONS | AccuracyReportType.PARENT_MODEL_PREDICTIONS, string>
  >
>;

export enum SemanticSegmentationReportEntityKey {
  ID = 'id',
  REPORT_ID = 'report_id',
  IMAGE_NAME = 'image_name',
  CLASS_ID = 'class_id',
  RESULT = 'result',
  AVERAGE_RESULT = 'average_result',
  PREDICTIONS = 'predictions',
  ANNOTATIONS = 'annotations',
}

export interface ISemanticSegmentationReportEntity {
  [SemanticSegmentationReportEntityKey.ID]: number;
  [SemanticSegmentationReportEntityKey.REPORT_ID]: number;
  [SemanticSegmentationReportEntityKey.IMAGE_NAME]: string;
  [SemanticSegmentationReportEntityKey.CLASS_ID]: number;
  [SemanticSegmentationReportEntityKey.RESULT]: number;
  [SemanticSegmentationReportEntityKey.PREDICTIONS]: number[][];
  [SemanticSegmentationReportEntityKey.ANNOTATIONS]: number[][];
}

export interface IAggregatedSemanticSegmentationReportEntity {
  [SemanticSegmentationReportEntityKey.IMAGE_NAME]: string;
  class_ids: number;
  [SemanticSegmentationReportEntityKey.AVERAGE_RESULT]: number;
}

export enum InstanceSegmentationReportEntityKey {
  ID = 'id',
  REPORT_ID = 'report_id',
  IMAGE_NAME = 'image_name',
  CLASS_ID = 'class_id',
  AP_PRECISION = 'ap_precision',
  ANNOTATIONS_COUNT = 'annotations_count',
  ANNOTATIONS = 'annotations',
  PREDICTIONS_COUNT = 'predictions_count',
  PREDICTIONS = 'predictions',
  MATCHES = 'matches',
}

export interface IInstanceSegmentationReportEntity {
  [InstanceSegmentationReportEntityKey.ID]: number;
  [InstanceSegmentationReportEntityKey.REPORT_ID]: number;
  [InstanceSegmentationReportEntityKey.IMAGE_NAME]: string;
  [InstanceSegmentationReportEntityKey.CLASS_ID]: number;
  [InstanceSegmentationReportEntityKey.AP_PRECISION]: number;
  [InstanceSegmentationReportEntityKey.ANNOTATIONS_COUNT]: number;
  [InstanceSegmentationReportEntityKey.ANNOTATIONS]: { segmentation: number[][] }[];
  [InstanceSegmentationReportEntityKey.PREDICTIONS_COUNT]: number;
  [InstanceSegmentationReportEntityKey.PREDICTIONS]: { segmentation: number[][]; score: number }[];
  [InstanceSegmentationReportEntityKey.MATCHES]: number;
}

export interface IAggregatedInstanceSegmentationReportEntity {
  [InstanceSegmentationReportEntityKey.REPORT_ID]: number;
  [InstanceSegmentationReportEntityKey.IMAGE_NAME]: string;
  class_ids: number;
  [InstanceSegmentationReportEntityKey.ANNOTATIONS_COUNT]: number;
  [InstanceSegmentationReportEntityKey.PREDICTIONS_COUNT]: number;
  [InstanceSegmentationReportEntityKey.MATCHES]: number;
}
