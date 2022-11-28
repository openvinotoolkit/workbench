"""
 OpenVINO DL Workbench
 Job Error class

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
import functools
import json

from config.constants import CELERY_RETRY_COUNTDOWN, CELERY_RETRY_MAX_RETRY, TRANSFORMERS_ONNX_ERROR_MAP_JSON
from wb.error.general_error import GeneralError
from wb.error.code_registry import CodeRegistry
from wb.main.enumerates import RemoteSetupStatusMessagesEnum, RemoteSetupStatusCodeEnum


class JobGeneralError(GeneralError):
    def __init__(self, message: str, job_id: int):
        super().__init__(message)
        self.details['jobId'] = job_id


class Int8CalibrationError(JobGeneralError):
    code = CodeRegistry.get_int8calibration_error_code()


class AccuracyError(JobGeneralError):
    code = CodeRegistry.get_accuracy_error_code()


class ProfilingError(JobGeneralError):
    code = CodeRegistry.get_profiling_error_code()


class ModelDownloaderError(JobGeneralError):
    code = CodeRegistry.get_model_downloader_error_code()


class ModelOptimizerError(JobGeneralError):
    code = CodeRegistry.get_model_optimizer_error_code()


class DatasetGenerationError(JobGeneralError):
    code = CodeRegistry.get_model_optimizer_error_code()


class DatumaroError(JobGeneralError):
    code = CodeRegistry.get_datumaro_error_code()


class ArtifactError(JobGeneralError):
    code = CodeRegistry.get_remove_upload_code()


class ModelAnalyzerError(JobGeneralError):
    code = CodeRegistry.get_model_analyzer_code()


class DeploymentManagerError(JobGeneralError):
    code = CodeRegistry.get_deployment_manager_code()


class ConvertKerasError(JobGeneralError):
    code = CodeRegistry.get_convert_keras_code()


class ReshapeModelError(JobGeneralError):
    code = CodeRegistry.get_reshape_model_error_code()


class ManualTaskRetryException(Exception):
    def __init__(self, message: str, countdown: int = CELERY_RETRY_COUNTDOWN,
                 max_retries: int = CELERY_RETRY_MAX_RETRY):
        super().__init__(message)
        self.retry_countdown = countdown
        self.max_retries = max_retries


class CancelTaskInChainException(Exception):
    pass


class SetupTargetError(JobGeneralError):
    def __init__(self, error_type, job_id):
        super().__init__(error_type, job_id)
        self.code = self.codes_map.get(error_type)

    codes_map = {
        RemoteSetupStatusMessagesEnum.OS_VERSION_ERROR.value:
            RemoteSetupStatusCodeEnum.OS_VERSION_ERROR.value,
        RemoteSetupStatusMessagesEnum.NO_INTERNET_CONNECTION.value:
            RemoteSetupStatusCodeEnum.NO_INTERNET_CONNECTION.value,
        RemoteSetupStatusMessagesEnum.NO_PYTHON.value:
            RemoteSetupStatusCodeEnum.NO_PYTHON.value,
        RemoteSetupStatusMessagesEnum.PYTHON_VERSION_ERROR.value:
            RemoteSetupStatusCodeEnum.PYTHON_VERSION_ERROR.value,
        RemoteSetupStatusMessagesEnum.PIP_VERSION_ERROR.value:
            RemoteSetupStatusCodeEnum.PIP_VERSION_ERROR.value,
    }


def format_error_message_decorator(method):
    @functools.wraps(method)
    def wrapped(*args, is_filter=False, **kwargs) -> str:
        error_dict = method(*args, **kwargs)
        model_type = kwargs.pop('model_type', None)
        if model_type:
            error_dict = {
                message_type: text.format(model_type) for message_type, text in error_dict.items()
            }
        if is_filter:
            return error_dict['title']
        else:
            return '\n\n'.join(error_dict.values())
    return wrapped


class TransformersONNXConversionError(JobGeneralError):
    code = CodeRegistry.get_transformers_onnx_error_code()

    with open(TRANSFORMERS_ONNX_ERROR_MAP_JSON) as f:
        message_map = json.load(f)

    def __init__(self, message: str,  job_id: int):
        message = self.replace_error_message(message)
        super().__init__(message, job_id)

    @format_error_message_decorator
    def replace_error_message(self, message: str) -> dict:
        for substring, replacement_string in self.message_map['conversion_errors'].items():
            if substring in message:
                return replacement_string

        return self.message_map['conversion_errors']['UnexpectedTransformersONNXError']

    @classmethod
    @format_error_message_decorator
    def get_no_config_message(cls) -> dict:
        return cls.message_map['filter']['no_config']

    @classmethod
    @format_error_message_decorator
    def get_no_model_type_message(cls) -> dict:
        return cls.message_map['filter']['no_model_type']

    @classmethod
    @format_error_message_decorator
    def get_not_supported_model_type_message(cls, model_type: str) -> dict:
        return cls.message_map['filter']['not_supported_model_type']

    @classmethod
    @format_error_message_decorator
    def get_not_supported_sequence_classification_message(cls, model_type: str) -> dict:
        return cls.message_map['filter']['not_supported_sequence_classification']

    @classmethod
    @format_error_message_decorator
    def get_decoder_not_supported_message(cls, model_type: str) -> dict:
        return cls.message_map['filter']['decoder_not_supported']

    @classmethod
    @format_error_message_decorator
    def get_has_missing_tokenizer_files_message(cls) -> dict:
        return cls.message_map['filter']['missing_tokenizer_files']
