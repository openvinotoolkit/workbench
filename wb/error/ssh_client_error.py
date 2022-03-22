"""
 OpenVINO DL Workbench
 Error classes for ssh client

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

from wb.error.general_error import GeneralError
from wb.main.enumerates import SSHAuthStatusCodeEnum


class SshClientError(GeneralError):
    pass


class SshAuthError(SshClientError):
    code = SSHAuthStatusCodeEnum.SSH_AUTH_ERROR.value


class SshAuthUsernameError(SshClientError):
    code = SSHAuthStatusCodeEnum.INCORRECT_USERNAME.value


class SshAuthTimeoutError(SshClientError):
    code = SSHAuthStatusCodeEnum.TIMEOUT.value


class SshAuthHostnameError(SshClientError):
    code = SSHAuthStatusCodeEnum.INCORRECT_HOSTNAME_PORT.value


class SshAuthKeyError(SshClientError):
    code = SSHAuthStatusCodeEnum.INCORRECT_KEY.value


class SshAuthKeyContentError(SshClientError):
    code = SSHAuthStatusCodeEnum.INCORRECT_KEY_CONTENT.value


class SshAuthKeyNameError(SshClientError):
    code = SSHAuthStatusCodeEnum.INCORRECT_KEY_CONTENT.value
