"""
 OpenVINO DL Workbench
 Class for conversion Segmentation annotations to Dataset Item

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
