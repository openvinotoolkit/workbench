"""
 OpenVINO DL Workbench
 Class for processing errors of POT

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
import re

from wb.main.console_tool_wrapper.error_message_processor import ErrorMessageProcessor


class PostTrainingOptimizationErrorMessageProcessor(ErrorMessageProcessor):
    @classmethod
    def recognize_error(cls, error_message: str, stage=None) -> str:
        error_pattern = r'.*Error:\s.*'
        threshold_error_pattern = re.search(
            r'Required threshold of accuracy drop cannot be achieved with any INT8 quantization. '
            r'Minimal accuracy drop: .+%',
            error_message)
        if threshold_error_pattern:
            message = threshold_error_pattern.group(0)
        elif re.search(error_pattern, error_message):
            error_prefix = 'Error: '
            message_start_index = error_message.index(error_prefix) + len(error_prefix)
            message = error_message[message_start_index:]
        else:

            message = (
                'Calibration tool failed in stage "{stage}" with error: {error}'
                    .format(stage=stage, error=str(error_message))
            )

        return message
