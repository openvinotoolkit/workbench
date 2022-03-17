"""
 OpenVINO DL Workbench
 Class for storing Datumaro cli params

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
from typing import Optional

from wb.main.console_tool_wrapper.console_parameter_validator import ConsoleParametersTypes
from wb.main.console_tool_wrapper.python_console_tool import PythonModuleTool
from wb.main.enumerates import DatumaroModesEnum
from wb.main.shared.enumerates import DatasetTypesEnum


class DatumaroTool(PythonModuleTool):
    def __init__(self):
        super().__init__()
        self.exe = 'datumaro'
        self.parameter_prefix = ''

    def set_mode(self, mode: DatumaroModesEnum):
        self.set_parameter(mode.value, True, ConsoleParametersTypes.flag)

    def set_conversion(self, input_format: DatasetTypesEnum, output_format: DatasetTypesEnum):
        self.set_parameter('--input-format', input_format.value, ConsoleParametersTypes.dataset_format)
        self.set_parameter('--output-format', output_format.value, ConsoleParametersTypes.dataset_format)

    def set_input_output_paths(self, input_path: str, output_path: Optional[str]):
        self.set_parameter('--input-path', input_path, ConsoleParametersTypes.path)
        if output_path:
            self.set_parameter('--output-dir', output_path, ConsoleParametersTypes.path)

    def enable_image_copy(self):
        self.set_parameter('--', True, ConsoleParametersTypes.flag)
        self.set_parameter('--save-images', True, ConsoleParametersTypes.flag)
