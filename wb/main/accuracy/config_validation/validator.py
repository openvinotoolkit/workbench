"""
 OpenVINO DL Workbench
 Accuracy config validator

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
from typing import Optional, Tuple

import yaml

from wb.main.accuracy.config_validation.validation_error import ACValidationResult
from wb.main.accuracy.config_validation.validators import yaml_validator, ac_schema_validator, wb_schema_validator, \
    yaml_utils
from wb.main.models import ProjectsModel


def validate_ac_config(project_id: int, config: str) -> Tuple[ACValidationResult, Optional[dict]]:
    """
    Validate ac config yaml
    :param project_id: project id
    :param config: ac config yaml string, expects
    name:
    launchers:
    datasets:
    format
    :return: ValidationResult and optional sanitized ac config yaml string
    """
    yaml_syntax_error = yaml_validator.validate(config)

    if yaml_syntax_error:
        return ACValidationResult(valid=False, errors=(yaml_syntax_error,)), None

    project: ProjectsModel = ProjectsModel.query.get(project_id)
    model_path = project.topology.path
    dataset_path = project.dataset.path

    config_dict = yaml.safe_load(config)

    ac_errors = wb_schema_validator.validate(config_dict, project)

    if ac_errors:
        ac_errors = yaml_utils.fill_error_marks(config, ac_errors)
        return ACValidationResult(valid=False, errors=ac_errors), None

    ac_schema_errors, sanitized_config = ac_schema_validator.validate(config_dict, model_path, dataset_path)

    if ac_schema_errors:
        ac_schema_errors = yaml_utils.fill_error_marks(config, ac_schema_errors)
        return ACValidationResult(valid=False, errors=ac_schema_errors), None

    return ACValidationResult(valid=True), sanitized_config
