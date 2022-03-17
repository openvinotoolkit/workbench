"""
 OpenVINO DL Workbench
 Huggingface model downloader

 Copyright (c) 2022 Intel Corporation

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
