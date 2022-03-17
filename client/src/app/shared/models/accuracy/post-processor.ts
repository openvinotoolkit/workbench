export enum PostProcessorType {
  RESIZE_PREDICTION_BOXES = 'resize_prediction_boxes',
  NMS = 'nms',
  ENCODE_SEGMENTATION_MASK = 'encode_segmentation_mask',
  RESIZE_SEGMENTATION_MASK = 'resize_segmentation_mask',
  NORMALIZE_LANDMARKS_POINTS = 'normalize_landmarks_points',
}

export type IPostProcessor =
  | IResizePredictionBoxesPostProcessor
  | INMSPostProcessor
  | IEncodeSegmentationMask
  | IResizeSegmentationMask
  | INormalizeLandmarkPointsPostProcessor;

export interface IResizePredictionBoxesPostProcessor {
  type: PostProcessorType.RESIZE_PREDICTION_BOXES;
}

export interface INMSPostProcessor {
  type: PostProcessorType.NMS;
  overlap: number;
}

export interface IEncodeSegmentationMask {
  type: PostProcessorType.ENCODE_SEGMENTATION_MASK;
  apply_to: 'annotation';
}

export interface IResizeSegmentationMask {
  type: PostProcessorType.RESIZE_SEGMENTATION_MASK;
  apply_to: 'prediction';
}

export interface INormalizeLandmarkPointsPostProcessor {
  type: PostProcessorType.NORMALIZE_LANDMARKS_POINTS;
}
