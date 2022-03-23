"""
 OpenVINO DL Workbench
 Class for mapping task to auto annotated dataset type

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
