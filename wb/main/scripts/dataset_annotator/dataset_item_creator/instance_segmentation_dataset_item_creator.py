"""
 OpenVINO DL Workbench
 Class for conversion Instance Segmentation annotations to Dataset Item

 Copyright (c) 2021 Intel Corporation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
      http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
"""
from pathlib import Path

from openvino.tools.accuracy_checker.representation import ContainerPrediction, CoCoInstanceSegmentationPrediction
from datumaro.components.extractor import DatasetItem, Polygon
from datumaro.util.image import Image

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
