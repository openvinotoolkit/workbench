"""
 OpenVINO DL Workbench
 Classes for management of parameters of pip tool

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
from pathlib import Path

from wb.main.console_tool_wrapper.console_parameter_validator import ConsoleParametersTypes
from wb.main.console_tool_wrapper.python_console_tool import PipModule, PythonModuleTool


class CreateVirtualEnvTool(PythonModuleTool):
    def __init__(self, environment_path: Path):
        super().__init__(parameters=[
            dict(value=str(environment_path), parameter_type=ConsoleParametersTypes.path),
        ])
        self.exe = 'virtualenv'


class CollectInstalledPackagesTool(PipModule):
    def __init__(self, python_exec: Path):
        super().__init__(python_exec=python_exec, parameters=[
            dict(name='freeze', parameter_type=ConsoleParametersTypes.flag),
            dict(name='--all', parameter_type=ConsoleParametersTypes.flag),
        ])


class UpdatePipTool(PipModule):
    def __init__(self, python_exec: Path):
        super().__init__(python_exec=python_exec, parameters=[
            dict(name='install', parameter_type=ConsoleParametersTypes.flag),
            dict(name='--upgrade', value='pip', parameter_type=ConsoleParametersTypes.path),
        ])


class InstallPackagesTool(PipModule):
    def __init__(self, python_exec: Path, requirement_file: Path, runtime_wheel: Path, dev_wheel: Path, mirror: str = None):
        super().__init__(python_exec=python_exec, parameters=[
            dict(name='install', parameter_type=ConsoleParametersTypes.flag),
            dict(name='-r', value=str(requirement_file), parameter_type=ConsoleParametersTypes.path),
            dict(value=str(runtime_wheel), parameter_type=ConsoleParametersTypes.path),
            dict(value=str(dev_wheel), parameter_type=ConsoleParametersTypes.path),
        ])
        if mirror:
            self.set_parameter(name='-i', value=mirror, parameter_type=ConsoleParametersTypes.url)
