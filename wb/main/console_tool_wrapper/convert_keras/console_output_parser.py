"""
 OpenVINO DL Workbench
 Class for parsing output of convert keras model script

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

from wb.error.job_error import ConvertKerasError
from wb.main.console_tool_wrapper.convert_keras.error_message_processor import ConvertKerasErrorMessageProcessor
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser


class ConvertKerasOutputParser(ConsoleToolOutputParser):
    def parse(self, string: str):
        error = ConvertKerasErrorMessageProcessor.python_error_pattern.findall(string)
        if error:
            raise ConvertKerasError(error[0], self._job_state_subject.job_id)
