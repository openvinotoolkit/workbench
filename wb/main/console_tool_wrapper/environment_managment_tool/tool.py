"""
 OpenVINO DL Workbench
 Classes for management of parameters of pip tool

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
