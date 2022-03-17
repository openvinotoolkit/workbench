"""
 OpenVINO DL Workbench
 Accuracy checker's configuration registry

 Copyright (c) 2018-2019 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
