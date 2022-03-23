"""
 OpenVINO DL Workbench
 Accuracy config schema validator

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
from typing import Optional, List, Tuple

from wb.main.accuracy.config_validation import task_type_detector
from wb.main.accuracy.config_validation.validation_error import ACValidationError
from wb.main.models import DatasetsModel, DevicesModel, ProjectsModel, TopologiesModel
from wb.main.shared.enumerates import TaskEnum, DatasetTypesEnum


def validate(config: dict, project: ProjectsModel) -> Optional[Tuple[ACValidationError]]:
    validation_errors: List[Optional[ACValidationError]] = [
        *_validate_launcher(config, project.dataset, project.device),
        _validate_datasets_count(config),
        _validate_model_name(config, project.topology)
    ]

    errors: Tuple[ACValidationError] = tuple(error for error in validation_errors if error is not None)

    return errors if errors else None


def _validate_launcher(config: dict, dataset: DatasetsModel, device: DevicesModel) -> Tuple[
    Optional[ACValidationError]]:
    error = _validate_launchers_count(config)
    if error:
        return (error,)

    return tuple([
        _validate_framework(config),
        _validate_device(config, device),
        _validate_dataset_compatibility(config, dataset),
        _validate_weights(config),
    ])


def _validate_launchers_count(config: dict) -> Optional[ACValidationError]:
    try:
        launchers = config['launchers']
    except Exception:
        return ACValidationError(message='No launcher provided')

    if not launchers or len(launchers) != 1:
        return ACValidationError(message='Exactly one launcher supported', path='launchers')

    return None


def _validate_framework(config: dict) -> Optional[ACValidationError]:
    try:
        framework = config['launchers'][0]['framework']
    except Exception:
        return ACValidationError(message='Launcher framework not found', path='launchers.0')

    if framework != 'openvino':
        return ACValidationError(
            message=f'Launcher framework: {framework} not supported. Supported value: openvino',
            entry=framework,
            path='launchers.0.framework'
        )

    return None


def _validate_device(config: dict, device: DevicesModel) -> Optional[ACValidationError]:
    try:
        device_entry = config['launchers'][0]['device']
    except Exception:
        return ACValidationError(message='Launcher device not found', path='launchers.0')

    if device_entry != device.type:
        return ACValidationError(
            message=f'Launcher device: {device_entry} not is supported by selected device ({device.product_name}).'
                    f' Supported value: {device.type}',
            entry=device_entry,
            path='launchers.0.device'
        )

    return None


def _validate_weights(config: dict) -> Optional[ACValidationError]:
    try:
        config['launchers'][0]['weights']
    except Exception:
        return ACValidationError(message='Launcher weights not found', path='launchers.0')

    return None


def _validate_dataset_compatibility(config: dict, dataset: DatasetsModel) -> Optional[ACValidationError]:
    try:
        adapter_type = config['launchers'][0]['adapter']['type']
    except Exception:
        return ACValidationError(message='Launcher adapter type not found', path='launchers.0.adapter')

    # allow accuracy analysis with parent model on not annotated dataset
    if dataset.dataset_type == DatasetTypesEnum.not_annotated:
        return None

    task_type: TaskEnum = task_type_detector.detect_types(adapter_type)[0]
    dataset_tasks: List[TaskEnum] = [dataset_task.task_type for dataset_task in dataset.task_types]
    if task_type not in dataset_tasks:
        return ACValidationError(
            message=f'Adapter type: {adapter_type} task is not supported by selected'
                    f' dataset ({dataset.name}) type: {dataset.dataset_type.value}',
            entry=adapter_type,
            path='launchers.0.adapter.type'
        )

    return None


def _validate_datasets_count(config: dict) -> Optional[ACValidationError]:
    try:
        datasets = config['datasets']
    except Exception:
        return ACValidationError(message='No dataset provided')

    if not datasets or len(datasets) != 1:
        return ACValidationError(message='Exactly one dataset supported', path='datasets')

    return None


def _validate_model_name(config: dict, model: TopologiesModel) -> Optional[ACValidationError]:
    try:
        name_entry = config['name']
    except Exception:
        return ACValidationError(message='Model name not found')

    if name_entry != model.name:
        return ACValidationError(
            message=f'Model name: {name_entry} should be equal: {model.name}',
            entry=name_entry,
            path='name'
        )

    return None
