"""
 OpenVINO DL Workbench
 Interface class for manage python console tool's

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
import sys
from pathlib import Path
from typing import List

from wb.main.console_tool_wrapper.console_tool import ConsoleTool


class PythonConsoleTool(ConsoleTool):
    def __init__(self, python_exec: Path = Path(sys.executable), parameters: list = None, environment: dict = None):
        super().__init__(parameters, environment)
        self.python = python_exec

    @property
    def console_command(self) -> str:
        return f'{str(self.python)} {super().console_command}'


class PythonModuleTool(PythonConsoleTool):
    @property
    def console_command(self) -> str:
        return f'{self.python} -m {self.exe} {self.console_command_params}'


class PipModule(PythonModuleTool):
    def __init__(self, python_exec: Path, parameters: List[dict]):
        super().__init__(python_exec=python_exec, parameters=parameters)
        self.parameter_prefix = ''
        self.exe = 'pip'
