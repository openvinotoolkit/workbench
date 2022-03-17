"""
 OpenVINO DL Workbench
 Inconsistent Upload Error class

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

from wb.error.general_error import GeneralError
from wb.error.code_registry import CodeRegistry


class FileChunkUploadError(GeneralError):
    code = CodeRegistry.get_general_error_code()


class InconsistentUploadError(GeneralError):
    code = CodeRegistry.get_remove_upload_code()


class InconsistentModelConfigurationError(GeneralError):
    code = CodeRegistry.get_defective_config_code()


class InconsistentDatasetError(InconsistentUploadError):
    code = CodeRegistry.get_remove_dataset_code()


class InconsistentModelError(InconsistentUploadError):
    code = CodeRegistry.get_remove_model_code()


class UnknownDatasetError(InconsistentDatasetError):
    pass
