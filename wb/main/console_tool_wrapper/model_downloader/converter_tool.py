"""
 OpenVINO DL Workbench
 Class for storing int8 calibration cli params

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
