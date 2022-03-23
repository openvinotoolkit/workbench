"""
 OpenVINO DL Workbench
 Creating Blueprints of existing endpoints

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
