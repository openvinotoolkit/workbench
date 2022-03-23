"""
 OpenVINO DL Workbench
 Abstract class for run console tool

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
from typing import Tuple, Optional

from wb.main.console_tool_wrapper.console_tool import ConsoleTool
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser


class ConsoleRunner:
    allowed_tools = (
        'accuracy_check',
        'convert_keras_model.py',
        'datumaro',
        'get_inference_engine_devices.sh',
        'get_system_resources.sh',
        'job.sh',
        'main.py',
        'omz_info_dumper',
        'omz_downloader',
        'openvino.model_zoo.omz_converter',
        'openvino.tools.mo',
        'pip',
        'python',
        'tar',
        'unzip',
        'virtualenv',
        'transformers.onnx',
    )

    def __init__(self,
                 tool: ConsoleTool,
                 parser: Optional[ConsoleToolOutputParser]):
        self.tool = tool
        self.parser = parser
        self.working_directory = None

    def run_console_tool(self, job: IJob = None, measure_performance: bool = False) -> Tuple[int, str]:
        """
        function to call console tool
        :param job: a job which run the console tool
        :param measure_performance: True for run performance tool False for else
        :return: exit code and full console log
        """
        raise NotImplementedError
