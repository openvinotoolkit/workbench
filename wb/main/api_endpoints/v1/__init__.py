"""
 OpenVINO DL Workbench
 Creating Blueprints of existing endpoints

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

from flask import Blueprint
from flask_jwt_extended import verify_jwt_in_request

V1_ACCURACY_API = Blueprint('accuracy_api', __name__)
V1_AUTH_API = Blueprint('auth_api', __name__)
V1_CANCEL_API = Blueprint('cancel_api', __name__)
V1_COMMON_API = Blueprint('common_api', __name__)
V1_DATASETS_API = Blueprint('datasets_api', __name__)
V1_DEPLOYMENT_API = Blueprint('deployment_api', __name__)
V1_DOWNLOAD_API = Blueprint('download_api', __name__)
V1_ENVIRONMENT_API = Blueprint('environment_api', __name__)
V1_EXPORT_PROJECT_API = Blueprint('export_project_api', __name__)
V1_INFERENCE_TEST_IMAGE_API = Blueprint('inference_test_image_api', __name__)
V1_INT8CALIBRATION_API = Blueprint('int8autotune_api', __name__)
V1_MODELS_API = Blueprint('models_api', __name__)
V1_MODEL_DOWNLOADER_API = Blueprint('model_downloader_api', __name__)
V1_MODEL_OPTIMIZER_API = Blueprint('model_optimizer_api', __name__)
V1_PROFILING_API = Blueprint('profiling_api', __name__)
V1_REGISTRY_API = Blueprint('registry_api', __name__)
V1_REMOTE_TARGETS_API = Blueprint('remote_targets_api', __name__)
V1_REMOTE_JOB_API = Blueprint('remote_job_api', __name__)
V1_HUGGINGFACE_API = Blueprint('huggingface_api', __name__)

PROTECTED_ENDPOINTS = [
    V1_ACCURACY_API,
    V1_CANCEL_API,
    V1_COMMON_API,
    V1_DATASETS_API,
    V1_DEPLOYMENT_API,
    V1_DOWNLOAD_API,
    V1_EXPORT_PROJECT_API,
    V1_ENVIRONMENT_API,
    V1_INFERENCE_TEST_IMAGE_API,
    V1_INT8CALIBRATION_API,
    V1_MODELS_API,
    V1_MODEL_DOWNLOADER_API,
    V1_MODEL_OPTIMIZER_API,
    V1_PROFILING_API,
    V1_REGISTRY_API,
    V1_REMOTE_TARGETS_API,
    V1_REMOTE_JOB_API,
    V1_HUGGINGFACE_API,
]

for endpoint in PROTECTED_ENDPOINTS:
    endpoint.before_request(verify_jwt_in_request)

BLUEPRINTS = (V1_AUTH_API, *PROTECTED_ENDPOINTS)

# pylint: disable=wrong-import-position
from . import (
    accuracy, auth, cancel, common, datasets,
    deployment, environment, export, profiling, int8_calibration,
    model_downloader, model_optimizer, models,
    socket_events, registry, remote_targets, remote_job,
    inference_test_image, huggingface
)
