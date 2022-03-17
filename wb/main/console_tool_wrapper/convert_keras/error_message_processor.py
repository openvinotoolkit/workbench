"""
 OpenVINO DL Workbench
 Class for processing errors from convert keras model script

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
import re

from wb.main.console_tool_wrapper.error_message_processor import ErrorMessageProcessor


class ConvertKerasErrorMessageProcessor(ErrorMessageProcessor):
    python_error_pattern = re.compile(r'\w+Error: \s(.*)')

    @classmethod
    def recognize_error(cls, error_message: str, unused_stage: str = None) -> str:
        python_error = cls.python_error_pattern.findall(error_message)
        if python_error:
            return python_error[0]
        return f'Convert keras model script finished with error: {error_message}'
