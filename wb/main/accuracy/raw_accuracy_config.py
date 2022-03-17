"""
 OpenVINO DL Workbench
 Accuracy config

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
from typing import Tuple

import yaml

from wb.main.accuracy.config_validation import validator, task_type_detector
from wb.main.accuracy.config_validation.validation_error import ACValidationResult
from wb.main.accuracy.path_prefixes import ACConfigPathPrefix
from wb.main.enumerates import TaskMethodEnum
from wb.main.models import ProjectsModel
from wb.main.shared.enumerates import TaskEnum


class RawAccuracyConfig:
    _config_dict: dict = None
    _sanitized_config_dict: dict = None
    project: ProjectsModel = None

    def __init__(self, project: ProjectsModel, config: dict):
        self.project = project
        self._config_dict = self._get_prefixed_paths_config(config)

    @staticmethod
    def validate_config(project_id: int, config: str) -> ACValidationResult:
        return validator.validate_ac_config(project_id, config)[0]

    def validate(self) -> ACValidationResult:
        result, sanitized_config = validator.validate_ac_config(
            self.project.id, yaml.safe_dump(self._config_dict['models'][0])
        )
        if result.valid:
            self._sanitized_config_dict = {'models': [sanitized_config]}

        return result

    def detect_types(self) -> Tuple[TaskEnum, TaskMethodEnum]:
        return task_type_detector.detect_types(
            self._sanitized_config_dict['models'][0]['launchers'][0]['adapter']['type']
        )

    def _get_prefixed_paths_config(self, config: dict) -> dict:
        config_string = yaml.safe_dump(config)

        for (entry, stub) in (
                (self.project.topology.path, ACConfigPathPrefix.MODEL_PATH.value),
                (self.project.dataset.path, ACConfigPathPrefix.DATASET_PATH.value),
        ):
            config_string = config_string.replace(entry, stub)

        return yaml.safe_load(config_string)

    def get_prefixed_path_config(self) -> dict:
        return self._config_dict

    def get_sanitized_config(self) -> dict:
        return self._sanitized_config_dict
