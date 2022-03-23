"""
 OpenVINO DL Workbench
 Class aggregates cli params for convert keras model script

 Copyright (c) 2020 Intel Corporation

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
import os

from config.constants import JOBS_SCRIPTS_FOLDER
from wb.main.console_tool_wrapper.console_tool import ConsoleParametersTypes
from wb.main.console_tool_wrapper.python_console_tool import PythonConsoleTool


class ConvertKerasTool(PythonConsoleTool):
    def __init__(self, python_executable: str, model_path: str, output_path: str, environment: dict = None):
        super().__init__(python_exec=python_executable, parameters=[
            dict(name='model', value=model_path, parameter_type=ConsoleParametersTypes.path),
            dict(name='output', value=output_path, parameter_type=ConsoleParametersTypes.path),
        ], environment=environment)
        self.parameter_prefix = '--'
        self.exe = os.path.join(JOBS_SCRIPTS_FOLDER, 'convert_keras_model.py')
