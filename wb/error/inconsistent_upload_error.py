"""
 OpenVINO DL Workbench
 Inconsistent Upload Error class

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
