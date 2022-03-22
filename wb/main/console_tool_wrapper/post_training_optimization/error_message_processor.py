"""
 OpenVINO DL Workbench
 Class for processing errors of POT

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
