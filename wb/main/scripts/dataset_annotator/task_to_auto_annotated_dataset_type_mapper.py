"""
 OpenVINO DL Workbench
 Class for mapping task to auto annotated dataset type

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

try:
    from wb.main.shared.enumerates import DatasetTypesEnum, TaskEnum
except ImportError:
    from shared.enumerates import DatasetTypesEnum, TaskEnum


class TaskToAutoAnnotatedDatasetTypeMapper:
    _task_type_to_dataset_type_map = {
        TaskEnum.classification: DatasetTypesEnum.imagenet_txt,
        TaskEnum.object_detection: DatasetTypesEnum.coco,
        TaskEnum.semantic_segmentation: DatasetTypesEnum.voc,
        TaskEnum.instance_segmentation: DatasetTypesEnum.coco,
    }

    @staticmethod
    def get_dataset_type_by_task(task_type: DatasetTypesEnum) -> DatasetTypesEnum:
        return TaskToAutoAnnotatedDatasetTypeMapper._task_type_to_dataset_type_map[task_type]
