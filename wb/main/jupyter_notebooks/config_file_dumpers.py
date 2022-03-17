"""
 OpenVINO DL Workbench
 Classes for config file dumpers in generated Jupyter notebook

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

import json
from pathlib import Path
from typing import Optional

import yaml

from wb.main.jupyter_notebooks.cell_template_contexts import AccuracyCodeCellTemplateContext, \
    Int8OptimizationCodeCellTemplateContext


class BaseConfigFileDumper:
    _config_directory = 'resources'
    _config_filename: str = None

    def __init__(self, notebook_directory_path: Path):
        if not self._config_filename:
            raise NotImplementedError('Config filename is not set')
        self._notebook_directory_path = notebook_directory_path
        self._config_directory_path.mkdir(parents=True, exist_ok=True)
        self._config_file_path.touch(exist_ok=True)

    @classmethod
    def get_relative_config_file_path(cls) -> Path:
        if not cls._config_filename:
            raise NotImplementedError('Config filename is not set')
        return Path(cls._config_directory) / cls._config_filename

    @property
    def _config_file_path(self) -> Path:
        return self._notebook_directory_path / self.get_relative_config_file_path()

    @property
    def _config_directory_path(self) -> Path:
        return self._config_file_path.parent

    def dump(self, cell_template_context: dict):
        if not cell_template_context:
            raise Exception(f'Cell template context is not provided for config dumper {self.__class__}')
        config_content = self._get_config_content(cell_template_context=cell_template_context)
        if not config_content:
            return
        with self._config_file_path.open(mode='w') as file:
            file.write(config_content)

    @staticmethod
    def _get_config_content(cell_template_context: dict) -> Optional[str]:
        raise NotImplementedError


class AccuracyConfigFileDumper(BaseConfigFileDumper):
    _config_filename = 'accuracy_config.yml'

    @staticmethod
    def _get_config_content(cell_template_context: AccuracyCodeCellTemplateContext) -> Optional[str]:
        json_config = cell_template_context.get('json_config')
        if not json_config:
            return None
        accuracy_config = json.loads(json_config)
        return yaml.dump(accuracy_config)


class Int8OptimizationConfigFileDumper(BaseConfigFileDumper):
    _config_filename = 'int8_optimization_config.json'

    @staticmethod
    def _get_config_content(cell_template_context: Int8OptimizationCodeCellTemplateContext) -> Optional[str]:
        return cell_template_context.get('int8_optimization_config')
