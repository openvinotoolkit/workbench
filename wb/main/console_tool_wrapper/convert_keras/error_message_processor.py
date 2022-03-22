"""
 OpenVINO DL Workbench
 Class for processing errors from convert keras model script

 Copyright (c) 2020 Intel Corporation

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


class ConvertKerasErrorMessageProcessor(ErrorMessageProcessor):
    python_error_pattern = re.compile(r'\w+Error: \s(.*)')

    @classmethod
    def recognize_error(cls, error_message: str, unused_stage: str = None) -> str:
        python_error = cls.python_error_pattern.findall(error_message)
        if python_error:
            return python_error[0]
        return f'Convert keras model script finished with error: {error_message}'
