"""
 OpenVINO DL Workbench
 Abstract class for run console tool

 Copyright (c) 2018 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
