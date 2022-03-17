"""
 OpenVINO DL Workbench
 General Error class

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

from wb.error.code_registry import CodeRegistry


class GeneralError(Exception):
    code = CodeRegistry.get_general_error_code()

    def __init__(self, message='Internal Server Error', details=None):
        super().__init__(message)
        self.message = message
        self.details = details or {}

    @classmethod
    def get_error_code(cls):
        return cls.code

    def get_error_message(self):
        return self.message
