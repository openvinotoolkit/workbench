"""
 OpenVINO DL Workbench
 Class for processing errors from script for setup remote target

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
