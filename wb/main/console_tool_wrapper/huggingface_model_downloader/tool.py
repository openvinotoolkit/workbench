"""
 OpenVINO DL Workbench
 Huggingface model downloader

 Copyright (c) 2022 Intel Corporation

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
from wb.main.console_tool_wrapper.python_console_tool import PythonModuleTool
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser


class HuggingfaceModelDownloaderTool(PythonModuleTool):
    def __init__(self, python_exec: Path, model_id: str, onnx_model_path: Path):
        super().__init__(python_exec=python_exec, parameters=[
            dict(name='model', value=model_id, parameter_type=ConsoleParametersTypes.path),
            dict(
                name='feature',
                value='sequence-classification',
                parameter_type=ConsoleParametersTypes.constant,
                values=['sequence-classification']
            ),
            dict(value=str(onnx_model_path), parameter_type=ConsoleParametersTypes.path),
        ])

        self.exe = 'transformers.onnx'
        self.parameter_prefix = '--'


class HuggingfaceModelDownloaderParser(ConsoleToolOutputParser):
    def __init__(self):
        super().__init__()

    def parse(self, string: str):
        # todo: implement progress reporting
        print(string)
