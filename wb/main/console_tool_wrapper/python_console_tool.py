"""
 OpenVINO DL Workbench
 Interface class for manage python console tool's

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
