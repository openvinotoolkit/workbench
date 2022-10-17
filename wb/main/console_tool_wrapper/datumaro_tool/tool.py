"""
 OpenVINO DL Workbench
 Class for storing Datumaro cli params

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
from typing import Optional

from wb.main.console_tool_wrapper.console_parameter_validator import ConsoleParametersTypes
from wb.main.console_tool_wrapper.python_console_tool import PythonModuleTool
from wb.main.enumerates import DatumaroModesEnum
from wb.main.shared.enumerates import DatasetTypesEnum


class DatumaroTool(PythonModuleTool):
    def __init__(self):
        super().__init__()
        self.exe = 'datumaro'
        self.parameter_prefix = ''

    def set_mode(self, mode: DatumaroModesEnum):
        self.set_parameter(mode.value, True, ConsoleParametersTypes.flag)

    def set_conversion(self, input_format: DatasetTypesEnum, output_format: DatasetTypesEnum):
        self.set_parameter('--input-format', input_format.value, ConsoleParametersTypes.dataset_format)
        self.set_parameter('--output-format', output_format.value, ConsoleParametersTypes.dataset_format)

    def _set_path(self, param_name: Optional[str], path: str):
        self.set_parameter(param_name, path, ConsoleParametersTypes.path)

    def set_input_path(self, path: str):
        self._set_path('--input-path', path)

    def set_output_path(self, path: str):
        self._set_path('--output-dir', path)

    def set_report_path(self, path: str):
        self._set_path('--json-report', path)

    def set_target(self, path: str):
        self._set_path('', path)

    def _set_flag(self, param_name: str):
        self.set_parameter(f'--{param_name}', True, ConsoleParametersTypes.flag)

    def enable_image_save(self):
        self._set_flag('save-images')

    def add_separator(self):
        self.set_parameter('--', True, ConsoleParametersTypes.flag)
