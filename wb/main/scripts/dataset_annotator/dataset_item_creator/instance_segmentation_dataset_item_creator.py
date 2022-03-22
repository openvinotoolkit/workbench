"""
 OpenVINO DL Workbench
 Class for conversion Instance Segmentation annotations to Dataset Item

 Copyright (c) 2021 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
from pathlib import Path

from openvino.tools.accuracy_checker.representation import ContainerPrediction, CoCoInstanceSegmentationPrediction
from datumaro import DatasetItem, Image, Polygon

try:
    from wb.main.shared.enumerates import TaskEnum
    from wb.main.scripts.dataset_annotator.dataset_item_creator.base_dataset_item_creator import BaseDatasetItemCreator
except ImportError:
    from .base_dataset_item_creator import BaseDatasetItemCreator
    from shared.enumerates import TaskEnum


class InstanceSegmentationDatasetItemCreator(BaseDatasetItemCreator):
    _task_type = TaskEnum.instance_segmentation

    label_group_id = 0

    def __init__(self):
        self.label_group_id = 0

    def from_annotation(self, image_path: Path, prediction: ContainerPrediction) -> DatasetItem:
        image_id = image_path.stem
        image = Image(path=str(image_path))
        segmentation_prediction: CoCoInstanceSegmentationPrediction = prediction['segmentation_prediction']

        polygons_obj = segmentation_prediction.to_polygon()

        annotations = []
        for label, score in zip(segmentation_prediction.labels, segmentation_prediction.scores):
            polygons = polygons_obj.get(label).pop(0)

            if score < 0.1:
                continue

            for polygon in polygons:
                annotation = Polygon(
                    points=[coord for coords in polygon.tolist() for coord in coords],
                    label=label,
                    group=self.label_group_id,
                )
                annotations.append(annotation)

            self.label_group_id += 1

        return DatasetItem(id=image_id, image=image, annotations=annotations)
