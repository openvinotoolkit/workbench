"""
 OpenVINO DL Workbench
 Accuracy checker's configuration registry

 Copyright (c) 2018-2019 Intel Corporation

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
from wb.main.models.enumerates import DatasetTypesEnum, TaskMethodEnum


class ConfigRegistry:
    dataset_recognizer_registry = {}
    task_method_registry = {}


def register_task_method_adapter(task_method: TaskMethodEnum):
    def decorate(func):
        ConfigRegistry.task_method_registry[task_method] = func
        return func

    return decorate


def register_dataset_recognizer(dataset_type: DatasetTypesEnum):
    def decorate(cls):
        ConfigRegistry.dataset_recognizer_registry[dataset_type] = cls
        return cls

    return decorate
