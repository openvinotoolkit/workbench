"""
 OpenVINO DL Workbench
 Serialization of accuracy checker representations

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
import base64
from typing import List, Union

import cv2
from openvino.tools.accuracy_checker.representation import BaseRepresentation, ClassificationPrediction, \
    DetectionPrediction, \
    SegmentationPrediction, CoCoInstanceSegmentationPrediction, ContainerPrediction, StyleTransferPrediction, \
    SuperResolutionPrediction, ImageInpaintingPrediction


class InferencePrediction:
    score: int
    category_id: int
    # (x_min, y_min, x_max, y_max)
    bbox: (int, int, int, int)
    segmentation: List[List[int]]
    image: str
    explanation_mask: str


def serialize(prediction: BaseRepresentation) -> List[InferencePrediction]:
    predictions: List[InferencePrediction]
    if isinstance(prediction, ClassificationPrediction):
        predictions = convert_classification_prediction(prediction)
    elif isinstance(prediction, DetectionPrediction):
        predictions = convert_object_detection_prediction(prediction)
    elif isinstance(prediction, SegmentationPrediction):
        predictions = convert_segmentation_prediction(prediction)
    elif isinstance(prediction, ContainerPrediction):
        predictions = convert_container_prediction(prediction)
    elif isinstance(prediction, StyleTransferPrediction):
        predictions = convert_image_processing_prediction(prediction)
    elif isinstance(prediction, ImageInpaintingPrediction):
        predictions = convert_image_processing_prediction(prediction)
    elif isinstance(prediction, SuperResolutionPrediction):
        predictions = convert_image_processing_prediction(prediction)
    else:
        raise NotImplementedError(f'{prediction.__class__} is not supported')

    return predictions


def convert_classification_prediction(prediction: ClassificationPrediction) -> List[InferencePrediction]:
    predictions: List[InferencePrediction] = []
    top_k = min(5, len(prediction.scores))
    for category_id in prediction.top_k(top_k):
        inference_prediction = InferencePrediction()
        inference_prediction.category_id = int(category_id)
        inference_prediction.score = float(prediction.scores[category_id])
        predictions.append(inference_prediction)

    return predictions


def convert_object_detection_prediction(prediction: DetectionPrediction) -> List[InferencePrediction]:
    predictions: List[InferencePrediction] = []

    for label, score, x_min, y_min, x_max, y_max in zip(
            prediction.labels,
            prediction.scores,
            prediction.x_mins,
            prediction.y_mins,
            prediction.x_maxs,
            prediction.y_maxs
    ):
        inference_prediction = InferencePrediction()
        inference_prediction.category_id = int(label)
        inference_prediction.score = float(score)
        inference_prediction.bbox = (float(x_min), float(y_min), float(x_max), float(y_max))
        predictions.append(inference_prediction)

    return predictions


def convert_segmentation_prediction(prediction: SegmentationPrediction) -> List[InferencePrediction]:
    predictions: List[InferencePrediction] = []

    for label, polygons in prediction.to_polygon().items():
        inference_prediction = InferencePrediction()
        inference_prediction.score = None
        inference_prediction.category_id = int(label)
        inference_prediction.segmentation = []

        for polygon in polygons:
            inference_prediction.segmentation.append([coord for coords in polygon.tolist() for coord in coords])

        predictions.append(inference_prediction)

    return predictions


def convert_container_prediction(prediction: ContainerPrediction) -> List[InferencePrediction]:
    predictions: List[InferencePrediction] = []
    segmentation_prediction: CoCoInstanceSegmentationPrediction = prediction['segmentation_prediction']
    detection_prediction: DetectionPrediction = prediction['detection_prediction']

    polygons_obj = segmentation_prediction.to_polygon() if segmentation_prediction.raw_mask else None
    for label, score, x_min, y_min, x_max, y_max in zip(segmentation_prediction.labels,
                                                        segmentation_prediction.scores,
                                                        detection_prediction.x_mins,
                                                        detection_prediction.y_mins,
                                                        detection_prediction.x_maxs,
                                                        detection_prediction.y_maxs):
        polygons = polygons_obj.get(label).pop(0) if polygons_obj else []
        inference_prediction = InferencePrediction()
        inference_prediction.score = float(score)
        inference_prediction.category_id = int(label)
        inference_prediction.bbox = (float(x_min), float(y_min), float(x_max), float(y_max))
        inference_prediction.segmentation = []

        for polygon in polygons:
            inference_prediction.segmentation.append([coord for coords in polygon.tolist() for coord in coords])

        predictions.append(inference_prediction)

    return predictions


PredictionType = Union[ImageInpaintingPrediction, StyleTransferPrediction, SuperResolutionPrediction]


def convert_image_processing_prediction(prediction: PredictionType) -> List[InferencePrediction]:
    # pylint: disable=no-member
    _, buffer = cv2.imencode('.png', prediction.value)
    jpg_as_text = base64.b64encode(buffer).decode('utf-8')

    inference_prediction = InferencePrediction()
    inference_prediction.image = jpg_as_text

    return [inference_prediction]
