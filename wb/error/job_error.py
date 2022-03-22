"""
 OpenVINO DL Workbench
 Job Error class

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


class TransformersONNXConversionError(JobGeneralError):
    code = CodeRegistry.get_transformers_onnx_error_code()

    with open(TRANSFORMERS_ONNX_ERROR_MAP_JSON) as f:
        message_map = json.load(f)

    def __init__(self, message: str,  job_id: int):
        message = self.replace_error_message(message)
        super().__init__(message, job_id)

    def replace_error_message(self, message: str) -> str:
        for substring, replacement_string in self.message_map.items():
            if substring in message:
                return replacement_string

        return f'Unexpected error: {message}'
