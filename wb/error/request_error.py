"""
 OpenVINO DL Workbench
 Classes for Request Errors

 Copyright (c) 2021 Intel Corporation

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


class BadRequestError(GeneralError):
    code = 400

    def __init__(self, message='Bad request'):
        super().__init__(message=message)


class NotFoundRequestError(GeneralError):
    code = 404

    def __init__(self, message='Not found'):
        super().__init__(message=message)


class InternalServerRequestError(GeneralError):
    code = 500

    def __init__(self, message='Internal server error'):
        super().__init__(message=message)
