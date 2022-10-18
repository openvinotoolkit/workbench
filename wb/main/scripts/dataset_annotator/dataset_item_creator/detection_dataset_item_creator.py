"""
 OpenVINO DL Workbench
 Class for conversion Detection annotations to Dataset Item

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
from typing import Union

from datumaro import Bbox, DatasetItem, Image
from openvino.tools.accuracy_checker.representation import DetectionPrediction, ContainerPrediction

try:
    from wb.main.scripts.dataset_annotator.dataset_item_creator.base_dataset_item_creator import BaseDatasetItemCreator
    from wb.main.shared.enumerates import TaskEnum
except ImportError:
    from .base_dataset_item_creator import BaseDatasetItemCreator
    from shared.enumerates import TaskEnum


class DetectionDatasetItemCreator(BaseDatasetItemCreator):
    _task_type = TaskEnum.object_detection

    def from_annotation(self, image_path: Path,
                        annotation: Union[DetectionPrediction, ContainerPrediction]) -> DatasetItem:
        if isinstance(annotation, DetectionPrediction):
            detection_annotation: DetectionPrediction = annotation
        elif isinstance(annotation, ContainerPrediction):
            detection_annotation: DetectionPrediction = annotation['detection_prediction']
        else:
            raise ValueError(f'Annotation type: {type(annotation)} is not supported')

        image_id = image_path.stem
        image = Image(path=str(image_path))
        annotations = []
        for label_id, score, x_min, y_min, x_max, y_max in zip(
                detection_annotation.labels, detection_annotation.scores,
                detection_annotation.x_mins, detection_annotation.y_mins,
                detection_annotation.x_maxs, detection_annotation.y_maxs
        ):
            if score < 0.1:
                continue
            height = y_max - y_min
            width = x_max - x_min
            box = Bbox(x=x_min, y=y_min, w=width, h=height, label=label_id)
            annotations.append(box)
        return DatasetItem(id=image_id, image=image, annotations=annotations)
