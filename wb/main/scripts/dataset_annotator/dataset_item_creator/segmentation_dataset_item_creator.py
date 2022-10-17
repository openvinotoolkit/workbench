"""
 OpenVINO DL Workbench
 Class for conversion Segmentation annotations to Dataset Item

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

import numpy as np
from openvino.tools.accuracy_checker.representation import SegmentationPrediction
from datumaro import DatasetItem, Image, Mask

try:
    from wb.main.shared.enumerates import TaskEnum
    from wb.main.scripts.dataset_annotator.dataset_item_creator.base_dataset_item_creator import BaseDatasetItemCreator
except ImportError:
    from .base_dataset_item_creator import BaseDatasetItemCreator
    from shared.enumerates import TaskEnum


class SegmentationDatasetItemCreator(BaseDatasetItemCreator):
    _task_type = TaskEnum.semantic_segmentation

    def from_annotation(self, image_path: Path, annotation: SegmentationPrediction) -> DatasetItem:
        image_id = image_path.stem
        image = Image(path=str(image_path))

        mask = annotation.mask
        if len(mask.shape) == 3:
            if 1 not in mask.shape:
                mask = np.argmax(mask, axis=0)
            else:
                mask = np.squeeze(mask)
        indexes = np.unique(mask)

        annotations = []
        for i in indexes:
            binary_mask = np.uint8(mask == i)
            annotations.append(Mask(image=binary_mask, label=i))

        return DatasetItem(id=image_id, image=image, annotations=annotations)
