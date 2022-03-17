"""
 OpenVINO DL Workbench
 Error classes for ssh client

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
