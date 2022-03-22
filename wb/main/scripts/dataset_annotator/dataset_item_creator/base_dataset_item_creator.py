"""
 OpenVINO DL Workbench
 Class for conversion annotations to Dataset Item

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
from typing import Dict, Type

from datumaro import DatasetItem
from openvino.tools.accuracy_checker.representation import BaseRepresentation

try:
    from wb.main.shared.enumerates import DatasetTypesEnum, TaskEnum
except ImportError:
    from shared.enumerates import DatasetTypesEnum, TaskEnum


class DatasetItemCreatorFactory:
    _registry: Dict[DatasetTypesEnum, Type['BaseDatasetItemCreator']] = {}

    @staticmethod
    def register_annotation_adapter(annotation_adapter_class: Type['BaseDatasetItemCreator']):
        annotation_adapter_task_type = annotation_adapter_class.get_task_type()
        if not annotation_adapter_task_type or annotation_adapter_task_type in DatasetItemCreatorFactory._registry:
            return

        DatasetItemCreatorFactory._registry[annotation_adapter_task_type] = annotation_adapter_class

    @staticmethod
    def create_annotation_adapter(task_enum: DatasetTypesEnum) -> 'BaseDatasetItemCreator':
        if task_enum not in DatasetItemCreatorFactory._registry:
            raise ValueError(f'There is not AnnotationAdapter class for {task_enum}')
        annotation_adapter_class = DatasetItemCreatorFactory._registry[task_enum]
        return annotation_adapter_class()


class MetaDatasetItemCreator(type):
    def __new__(cls, *args, **kwargs):
        job_class = super(MetaDatasetItemCreator, cls).__new__(cls, *args, **kwargs)
        DatasetItemCreatorFactory.register_annotation_adapter(job_class)
        return job_class


class BaseDatasetItemCreator(metaclass=MetaDatasetItemCreator):
    _task_type: TaskEnum = None

    def from_annotation(self, image_path: Path, annotation: BaseRepresentation) -> DatasetItem:
        raise NotImplementedError

    @classmethod
    def get_task_type(cls) -> TaskEnum:
        return cls._task_type
