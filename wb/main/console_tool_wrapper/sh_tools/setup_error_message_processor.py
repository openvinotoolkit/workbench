"""
 OpenVINO DL Workbench
 Class for processing errors from script for setup remote target

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
from typing import Optional

from config.constants import NO_SUDO_SETUP_MESSAGE
from wb.main.console_tool_wrapper.error_message_processor import ErrorMessageProcessor
from wb.main.enumerates import RemoteSetupStatusMessagesEnum


class SetupErrorMessageProcessor(ErrorMessageProcessor):
    match_error = {
        'The target does not have internet connection.':
            RemoteSetupStatusMessagesEnum.NO_INTERNET_CONNECTION.value,
        'Python is not installed on the machine.':
            RemoteSetupStatusMessagesEnum.NO_PYTHON.value,
        'found os: is not supported.':
            RemoteSetupStatusMessagesEnum.OS_VERSION_ERROR.value,
        'Python is not supported':
            RemoteSetupStatusMessagesEnum.PYTHON_VERSION_ERROR.value,
        'Pip is not supported':
            RemoteSetupStatusMessagesEnum.PIP_VERSION_ERROR.value,
    }

    match_warning = {
        NO_SUDO_SETUP_MESSAGE: RemoteSetupStatusMessagesEnum.NO_SUDO_WARNING.value,
    }

    @classmethod
    def recognize_warning(cls, output: str) -> Optional[str]:
        for pattern, message in cls.match_warning.items():
            pattern_compiled = re.compile(pattern)
            if pattern_compiled.search(output):
                return message
        return None
