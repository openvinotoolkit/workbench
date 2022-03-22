"""
 OpenVINO DL Workbench
 Class for conversion Classification annotations to Dataset Item

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
