"""
 OpenVINO DL Workbench
 Classes for storing parameters of local and remote job tools

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
from typing import Optional

from config.constants import SERVER_MODE
from wb.main.console_tool_wrapper.console_tool import ConsoleParametersTypes, ConsoleTool


class WorkbenchJobTool(ConsoleTool):
    def __init__(self, job_script_path: str, openvino_package_root_path: str,
                 job_bundle_path: str, venv_path: Optional[str] = None):
        super().__init__()
        self.job_bundle_path = job_bundle_path  # TODO 77386 Remove unused parameter
        self.set_parameter(name='openvino-package-root', value=openvino_package_root_path,
                           parameter_type=ConsoleParametersTypes.path)
        self.exe = job_script_path

        if venv_path:
            self.set_parameter(name='venv-path',
                               value=venv_path,
                               parameter_type=ConsoleParametersTypes.path)
        # TODO Create enum for server modes
        elif SERVER_MODE == 'development':
            self.set_parameter(name='venv-path',
                               value=Path(sys.executable).parent.parent,
                               parameter_type=ConsoleParametersTypes.path)
