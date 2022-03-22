"""
 OpenVINO DL Workbench
 Accuracy api handlers

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

import json

from wb.extensions_factories.database import get_db_session_for_app
from wb.main.accuracy.config_validation.validation_error import ACValidationResult
from wb.main.accuracy.raw_accuracy_config import RawAccuracyConfig
from wb.main.accuracy_utils.accuracy_utils import construct_accuracy_config_template, construct_accuracy_tool_config
from wb.main.enumerates import TaskMethodEnum
from wb.main.models import ProjectsModel, TopologiesMetaDataModel, ProjectAccuracyModel
from wb.main.shared.enumerates import TaskEnum, DatasetTypesEnum


def validate_raw_accuracy_config(project_id: int, config: str) -> ACValidationResult:
    return RawAccuracyConfig.validate_config(project_id, config)


def get_raw_accuracy_config(project_id: int) -> dict:
    project: ProjectsModel = ProjectsModel.query.get(project_id)

    raw_config: dict

    # if advanced accuracy config exists return it
    project_accuracy: ProjectAccuracyModel = project.accuracy
    if project_accuracy:
        raw_config = json.loads(project_accuracy.raw_configuration)
    else:
        task_method: TaskMethodEnum = project.topology.meta.topology_type
        task_type: TaskEnum = project.topology.meta.task_type

        compatible = (
                project.dataset.dataset_type == DatasetTypesEnum.not_annotated or
                project.topology.meta.task_type in [dataset_task.task_type for dataset_task in
                                                    project.dataset.task_types]
        )

        generic = (
                (task_type == TaskEnum.generic and task_method == TaskMethodEnum.generic) or
                (task_type is None and task_method is None)
        )

        if generic or not compatible:
            # if no basic accuracy config exists return template
            raw_config = construct_accuracy_config_template(
                project.topology,
                project.dataset,
                project.device,
            ).to_dict()
        else:
            # if basic accuracy config exists build raw config
            raw_config = construct_accuracy_tool_config(
                project.topology,
                project.dataset,
                project.device
            ).to_dict()

    config = RawAccuracyConfig(project, raw_config)

    return config.get_prefixed_path_config()


def set_raw_accuracy_config(project_id: int, config: dict):
    project: ProjectsModel = ProjectsModel.query.get(project_id)

    raw_config = RawAccuracyConfig(project, config)

    validation_result = raw_config.validate()

    if not validation_result.valid:
        raise ValueError('Accuracy config is not valid')

    task_type: TaskEnum
    task_method: TaskMethodEnum
    task_type, task_method = raw_config.detect_types()

    _set_model_types(project, task_type, task_method)

    project_accuracy: ProjectAccuracyModel = project.accuracy

    if not project_accuracy:
        project_accuracy = ProjectAccuracyModel()

    project_accuracy.raw_configuration = json.dumps(raw_config.get_sanitized_config())
    project_accuracy.write_record(get_db_session_for_app())

    project.project_accuracy_id = project_accuracy.id
    project.write_record(get_db_session_for_app())


def _set_model_types(project: ProjectsModel, task_type: TaskEnum, task_method: TaskMethodEnum):
    topology_metadata: TopologiesMetaDataModel = project.topology.meta

    topology_metadata.task_type = task_type
    topology_metadata.topology_type = task_method

    # taskType and taskMethod stored in a json string as well
    # json method overrides topology_metadata.task_type and topology_metadata.topology_type
    # by json string types contents
    # pylint: disable=fixme
    # TODO: remove taskType and taskMethod from advanced_configuration
    configuration = json.loads(topology_metadata.advanced_configuration)
    configuration['taskType'] = task_type.value
    configuration['taskMethod'] = task_method.value
    topology_metadata.advanced_configuration = json.dumps(configuration)

    topology_metadata.write_record(get_db_session_for_app())


def delete_raw_accuracy_config(project_id: int):
    project: ProjectsModel = ProjectsModel.query.get(project_id)
    accuracy: ProjectAccuracyModel = project.accuracy

    project.project_accuracy_id = None
    project.write_record(get_db_session_for_app())

    accuracy.delete_record(get_db_session_for_app())
