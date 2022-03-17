"""
 OpenVINO DL Workbench
 Class aggregates cli params for convert keras model script

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
import os

from config.constants import JOBS_SCRIPTS_FOLDER
from wb.main.console_tool_wrapper.console_tool import ConsoleParametersTypes
from wb.main.console_tool_wrapper.python_console_tool import PythonConsoleTool


class ConvertKerasTool(PythonConsoleTool):
    def __init__(self, python_executable: str, model_path: str, output_path: str, environment: dict = None):
        super().__init__(python_exec=python_executable, parameters=[
            dict(name='model', value=model_path, parameter_type=ConsoleParametersTypes.path),
            dict(name='output', value=output_path, parameter_type=ConsoleParametersTypes.path),
        ], environment=environment)
        self.parameter_prefix = '--'
        self.exe = os.path.join(JOBS_SCRIPTS_FOLDER, 'convert_keras_model.py')
