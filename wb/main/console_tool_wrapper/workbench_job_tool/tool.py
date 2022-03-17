"""
 OpenVINO DL Workbench
 Classes for storing parameters of local and remote job tools

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
import sys
from pathlib import Path
from typing import Optional

from config.constants import SERVER_MODE
from wb.main.console_tool_wrapper.console_tool import ConsoleParametersTypes, ConsoleTool


class WorkbenchJobTool(ConsoleTool):
    def __init__(self, job_script_path: str,
                 job_bundle_path: str, venv_path: Optional[str] = None):
        super().__init__()
        self.job_bundle_path = job_bundle_path  # TODO 77386 Remove unused parameter
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
