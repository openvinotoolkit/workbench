"""
 OpenVINO DL Workbench
 Class for storing anything codes

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
import enum


class JWTAuthStatusCodeEnum(enum.Enum):
    MISSING_JWT = 4011
    INVALID_JWT = 4012
    EXPIRED_ACCESS_JWT = 4013
    EXPIRED_REFRESH_JWT = 4014


class CodeRegistry:
    # pylint: disable=too-many-public-methods
    CODES = {

        'GENERAL_SERVER_ERROR': 1001,

        'DEFECTIVE_CONFIG_ERROR': 2001,

        'REMOVED_UPLOAD': 3001,
        'REMOVED_DATASET': 3002,
        'REMOVED_MODEL': 3003,

        # CONSOLE TOOLS ERRORS
        'INT8CALIBRATION_ERROR': 4001,
        'PROFILING_ERROR': 4002,
        'MODEL_DOWNLOADER_ERROR': 4004,
        'MODEL_OPTIMIZER_ERROR': 4005,
        'ACCURACY_ERROR': 4006,
        'MODEL_ANALYZER_ERROR': 4007,
        'DEPLOYMENT_MANAGER_ERROR': 4008,
        'DATUMARO_ERROR': 4009,
        'RESHAPE_MODEL_ERROR': 4010,

        # DATABASE ERRORS
        'DATABASE_ERROR': 5001,

        # AUTHENTICATION ERRORS
        'MISSING_JWT': JWTAuthStatusCodeEnum.MISSING_JWT.value,
        'INVALID_JWT': JWTAuthStatusCodeEnum.INVALID_JWT.value,
        'EXPIRED_ACCESS_JWT': JWTAuthStatusCodeEnum.EXPIRED_ACCESS_JWT.value,
        'EXPIRED_REFRESH_JWT': JWTAuthStatusCodeEnum.EXPIRED_REFRESH_JWT.value,

        'PARSE_ENV_ERROR': 6001,
        'SANITIZE_PARAMETER_ERROR': 6002,

        'CONVERT_KERSAS_ERROR': 9001,

        # DevCloud errors
        'DEV_CLOUD_GENERAL_ERROR': 7001,
        'DEV_CLOUD_NOT_RUNNING_ERROR': 7002,
        'DEV_CLOUD_HANDSHAKE_ERROR': 7003,
        'DEV_CLOUD_DEVICES_ERROR': 7004,
        'DEV_CLOUD_REMOTE_JOB_ERROR': 7005,
    }

    @classmethod
    def get_accuracy_error_code(cls):
        return cls.CODES['ACCURACY_ERROR']

    @classmethod
    def get_profiling_error_code(cls, ):
        return cls.CODES['PROFILING_ERROR']

    @classmethod
    def get_database_error_code(cls):
        return cls.CODES['DATABASE_ERROR']

    @classmethod
    def get_datumaro_error_code(cls):
        return cls.CODES['DEPLOYMENT_MANAGER_ERROR']

    @classmethod
    def get_defective_config_code(cls):
        return cls.CODES['DEFECTIVE_CONFIG_ERROR']

    @classmethod
    def get_deployment_manager_code(cls):
        return cls.CODES['DEPLOYMENT_MANAGER_ERROR']

    @classmethod
    def get_convert_keras_code(cls):
        return cls.CODES['CONVERT_KERSAS_ERROR']

    @classmethod
    def get_general_error_code(cls):
        return cls.CODES['GENERAL_SERVER_ERROR']

    @classmethod
    def get_int8calibration_error_code(cls, ):
        return cls.CODES['INT8CALIBRATION_ERROR']

    @classmethod
    def get_model_analyzer_code(cls):
        return cls.CODES['MODEL_ANALYZER_ERROR']

    @classmethod
    def get_model_optimizer_error_code(cls, ):
        return cls.CODES['MODEL_OPTIMIZER_ERROR']

    @classmethod
    def get_model_downloader_error_code(cls, ):
        return cls.CODES['MODEL_DOWNLOADER_ERROR']

    @classmethod
    def get_remove_dataset_code(cls):
        return cls.CODES['REMOVED_DATASET']

    @classmethod
    def get_remove_model_code(cls):
        return cls.CODES['REMOVED_MODEL']

    @classmethod
    def get_remove_upload_code(cls):
        return cls.CODES['REMOVED_UPLOAD']

    @classmethod
    def get_parse_env_error_code(cls):
        return cls.CODES['PARSE_ENV_ERROR']

    @classmethod
    def get_sanitize_parameter_error_code(cls):
        return cls.CODES['SANITIZE_PARAMETER_ERROR']

    @classmethod
    def get_dev_cloud_general_error_code(cls):
        return cls.CODES['DEV_CLOUD_GENERAL_ERROR']

    @classmethod
    def get_dev_cloud_not_running_error_code(cls):
        return cls.CODES['DEV_CLOUD_NOT_RUNNING_ERROR']

    @classmethod
    def get_dev_cloud_handshake_error_code(cls):
        return cls.CODES['DEV_CLOUD_HANDSHAKE_ERROR']

    @classmethod
    def get_dev_cloud_devices_error_code(cls):
        return cls.CODES['DEV_CLOUD_DEVICES_ERROR']

    @classmethod
    def get_dev_cloud_remote_job_error_code(cls):
        return cls.CODES['DEV_CLOUD_REMOTE_JOB_ERROR']

    @classmethod
    def get_reshape_model_error_code(cls):
        return cls.CODES['RESHAPE_MODEL_ERROR']
