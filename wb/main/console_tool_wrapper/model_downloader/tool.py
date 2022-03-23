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

from wb.main.console_tool_wrapper.console_tool import ConsoleParametersTypes
from wb.main.console_tool_wrapper.console_tool import ConsoleTool


class ModelDownloaderData(TypedDict):
    name: str
    outputDir: str


class ModelDownloaderTool(ConsoleTool):
    def __init__(self, config: ModelDownloaderData = None):
        super().__init__(parameters=[
            dict(name='name', value=config['name'], parameter_type=ConsoleParametersTypes.filename),
            dict(name='output_dir', value=config['outputDir'], parameter_type=ConsoleParametersTypes.path),
            dict(name='progress_format', value='json', parameter_type=ConsoleParametersTypes.constant, values=['json'])
        ])
        self.exe = 'omz_downloader'
        self.parameter_prefix = '--'
