"""
 OpenVINO DL Workbench
 Class for storing int8 calibration cli params

 Copyright (c) 2018 Intel Corporation

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

from typing_extensions import TypedDict

from wb.main.console_tool_wrapper.console_parameter_validator import ConsoleParametersTypes
from wb.main.console_tool_wrapper.python_console_tool import PythonModuleTool


class OMZTopologyConvertData(TypedDict):
    downloadDir: str
    name: str
    precision: str
    python_executable: str


class OMZTopologyConvertTool(PythonModuleTool):
    def __init__(self, config: OMZTopologyConvertData):
        super().__init__(python_exec=config['python_executable'], parameters=[
            dict(name='download_dir', value=config['downloadDir'], parameter_type=ConsoleParametersTypes.path),
            dict(name='name', value=config['name'], parameter_type=ConsoleParametersTypes.filename),
            dict(name='precision', value=config['precision'], parameter_type=ConsoleParametersTypes.precision)
        ])

        self.parameter_prefix = '--'
        self.exe = 'openvino.model_zoo.omz_converter'
