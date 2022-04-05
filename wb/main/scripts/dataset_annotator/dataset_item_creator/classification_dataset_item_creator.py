"""
 OpenVINO DL Workbench
 Class for conversion Classification annotations to Dataset Item

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

from datumaro import DatasetItem, Image, Label
from openvino.tools.accuracy_checker.representation import ClassificationPrediction

try:
    from wb.main.scripts.dataset_annotator.dataset_item_creator.base_dataset_item_creator import BaseDatasetItemCreator
    from wb.main.shared.enumerates import TaskEnum
except ImportError:
    from .base_dataset_item_creator import BaseDatasetItemCreator
    from shared.enumerates import TaskEnum


class ClassificationDatasetItemCreator(BaseDatasetItemCreator):
    _task_type = TaskEnum.classification

    def from_annotation(self, image_path: Path, annotation: ClassificationPrediction) -> DatasetItem:
        image_id = image_path.stem
        image = Image(path=str(image_path))
        label = Label(label=annotation.label)
        return DatasetItem(id=image_id, image=image, annotations=[label])
