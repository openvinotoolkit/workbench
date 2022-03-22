"""
 OpenVINO DL Workbench
 Constants variable

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

import os
import re
import site
import sys
from inspect import getfile
from pathlib import Path

from config.utils import (find_predefined_transformations_configs, make_canonical_path,
                          parse_host_port_from_url, find_openvino_wheels_by_python_version,
                          find_runtime_openvino_wheels)

from wb.main.enumerates import OpenVINOWheelsEnum
from wb.utils.get_env_var import get_env_var

INTEL_OPENVINO_DIR = get_env_var('INTEL_OPENVINO_DIR')
OPENVINO_VERSION_REGEXP = r'openvino_20\d\d\.\d\.\d\.\d+'
SERVER_MODE = get_env_var(name='SERVER_MODE', default='development')
ROOT_FOLDER = make_canonical_path(os.path.dirname(os.path.dirname(getfile(lambda: 0))))
ROOT_FOLDER = re.sub(OPENVINO_VERSION_REGEXP, 'openvino_2022', ROOT_FOLDER)
DEFAULT_DATA_FOLDER = os.path.join(ROOT_FOLDER, 'wb', 'data')
DATA_FOLDER = make_canonical_path(get_env_var(name='OPENVINO_WORKBENCH_DATA_PATH', default=DEFAULT_DATA_FOLDER))
DATA_FOLDER = re.sub(OPENVINO_VERSION_REGEXP, 'openvino_2022', DATA_FOLDER)
ESSENTIAL_DATA_FOLDER = make_canonical_path(get_env_var(name='WORKBENCH_PUBLIC_DIR', default=DATA_FOLDER))
ESSENTIAL_DATA_FOLDER = re.sub(OPENVINO_VERSION_REGEXP, 'openvino_2022', ESSENTIAL_DATA_FOLDER)
UPLOAD_FOLDER_DATASETS = Path(ESSENTIAL_DATA_FOLDER) / 'datasets'
UPLOAD_FOLDER_TOKENIZERS = Path(ESSENTIAL_DATA_FOLDER) / 'tokenizers'
UPLOADS_FOLDER = os.path.join(DATA_FOLDER, 'uploads')
TARGETS_FOLDER = os.path.join(DATA_FOLDER, 'targets')
ACCURACY_ARTIFACTS_FOLDER = os.path.join(DATA_FOLDER, 'accuracy_artifacts')
DATASET_ANNOTATION_ARTIFACTS_FOLDER = os.path.join(DATA_FOLDER, 'dataset_annotation')
ACCURACY_RESULT_FILE_NAME = 'accuracy_result.json'
JUPYTER_NOTEBOOKS_FOLDER = os.path.join(ESSENTIAL_DATA_FOLDER, 'jupyter_notebooks')
JUPYTER_CELL_TEMPLATES_FOLDER = os.path.join(ROOT_FOLDER, 'wb', 'main', 'jupyter_notebooks', 'cell_templates')
UPLOAD_FOLDER_MODELS = os.path.join(ESSENTIAL_DATA_FOLDER, 'models')
CONSOLE_TOOL_WRAPPER_FOLDER = os.path.join(ROOT_FOLDER, 'wb', 'main', 'console_tool_wrapper')
TRANSFORMERS_ONNX_ERROR_MAP_JSON = Path(ROOT_FOLDER) / 'wb' / 'error' / 'transformers_onnx_conversion_error_map.json'
VOC_IMAGES_FOLDER = 'JPEGImages'
VOC_ANNOTATIONS_FOLDER = 'Annotations'
VOC_IMAGESETS_FOLDER = 'ImageSets'
VOC_MASKS_FOLDER = 'SegmentationClass'
LFW_PAIRS_LENGTH = 2
VGGFACE2_BBOX_LENGTH = 5
LNDREID_LANDMARK_LENGTH = 11
ORIGINAL_FOLDER = 'original'

DEFAULT_LOG_FILE = os.path.join(ROOT_FOLDER, 'server.log') if SERVER_MODE == 'production' else None
LOG_FILE = get_env_var(name='WB_LOG_FILE', default=DEFAULT_LOG_FILE)
LOG_LEVEL = get_env_var(name='WB_LOG_LEVEL', default='DEBUG').upper()

PROFILING_ARTIFACTS_REPORT_DIR = os.path.join(DATA_FOLDER, 'profiling_artifacts')
INT8_CALIBRATION_ARTIFACTS_PATH = Path(DATA_FOLDER, 'int8_calibration_artifacts')
RESHAPE_MODEL_ARTIFACTS_PATH = Path(DATA_FOLDER) / 'reshape_model_artifacts'
RESHAPE_MODEL_CONFIG_FILE_NAME = 'reshape_model.config.json'

MODEL_DOWNLOADS_FOLDER = os.path.join(DATA_FOLDER, 'downloads')
DEPENDENCIES_FOLDER = os.path.join(ROOT_FOLDER, 'dependencies')
ARTIFACTS_PATH = os.path.join(DATA_FOLDER, 'artifacts')
BUNDLES_PATH = os.path.join(ROOT_FOLDER, 'bundles')
UBUNTU_20_BUNDLE_PATH = os.path.join(BUNDLES_PATH, 'ubuntu20')
UBUNTU_18_BUNDLE_PATH = os.path.join(BUNDLES_PATH, 'ubuntu18')

JOBS_SCRIPTS_FOLDER_NAME = 'scripts'
SHARED_MODULE_FOLDER_NAME = 'shared'
JOBS_SCRIPTS_FOLDER = os.path.join(ROOT_FOLDER, 'wb', 'main', JOBS_SCRIPTS_FOLDER_NAME)
SHARED_MODULE_FOLDER = os.path.join(ROOT_FOLDER, 'wb', 'main', SHARED_MODULE_FOLDER_NAME)
BASE_JOB_SCRIPT_NAME = 'base_job.template'
JOB_SCRIPT_NAME = 'job.sh'
JOB_ARTIFACTS_FOLDER_NAME = 'job_artifacts'
JOB_ARTIFACTS_ARCHIVE_NAME = 'artifact.tar.gz'

PROFILING_JOB_WRAPPER_NAME = 'profiling.py'
PROFILING_BINARY_DATASET_FOLDER = 'binary_dataset'
PROFILING_CONFIGURATION_FILE_NAME = 'profiling.conf.json'

INT8_CALIBRATION_CONFIGURATION_FILE_NAME = 'int8_calibration.config.json'

ACCURACY_CONFIGURATION_FILE_NAME = 'accuracy.config.yaml'
CHECK_ACCURACY_SCRIPT_PATH = os.path.join('accuracy_tool', 'check_accuracy.py')

DATASET_ANNOTATION_ACCURACY_CONFIGURATION_FILE_NAME = 'dataset_annotation_accuracy.config.yaml'

DATASET_ANNOTATOR_FOLDER_NAME = 'dataset_annotator'
DATASET_ANNOTATOR_SCRIPT_PATH = os.path.join(DATASET_ANNOTATOR_FOLDER_NAME, 'main.py')
DATASET_ANNOTATOR_LOCAL_SCRIPT_PATH = os.path.join(JOBS_SCRIPTS_FOLDER, DATASET_ANNOTATOR_FOLDER_NAME)

DB_USERNAME = get_env_var(name='DB_USER', default='workbench')
DB_NAME = get_env_var(name='DB_NAME', default='workbench')
DB_PASSWORD = get_env_var(name='DB_PASSWORD', default='openvino')

JWT_SECRET_KEY = get_env_var(name='JWT_SECRET_KEY', default='openvino')
IS_TEST_DEV = get_env_var(name='PIPELINE_ENVIRONMENT', cast_function=int) == 1
SSL_VERIFIED_ENABLED = get_env_var(name='SSL_VERIFY', cast_function=str) == 'on'
APP_HOST = get_env_var(name='API_HOST', default='127.0.0.1', cast_function=str)
API_PORT = get_env_var(name='API_PORT', default=5676, cast_function=int)
PROXY_PORT = get_env_var(name='PROXY_PORT', default=5675, cast_function=int)
PUBLIC_PORT = get_env_var(name='PUBLIC_PORT', default=5665, cast_function=int)

IS_TLS_ENABLED = get_env_var(name='SSL_CERT', default=False, cast_function=bool) and get_env_var(name='SSL_KEY',
                                                                                                 default=False,
                                                                                                 cast_function=bool)
SAVE_TOKEN_TO_FILE = get_env_var(name='SAVE_TOKEN_TO_FILE', default=1, cast_function=int) == 1

TF2_PYTHON = get_env_var(name='VENV_TF2_PYTHON', default=None)
ENVIRONMENTS_FOLDER = get_env_var(name='ENVIRONMENTS_FOLDER',
                                  default=os.path.join(ESSENTIAL_DATA_FOLDER, 'environments'))

DB_RESTORE_FAIL = get_env_var(name='DB_RESTORE_FAIL', default=None)
DB_RESTORE_FILE = get_env_var(name='DATABASE_DUMP_FILE', default=None)
DB_URL = get_env_var(name='DB_URL', default='')

BROKER_HOST = get_env_var(name='RABBITMQ_HOST', default='localhost')
BROKER_USER = get_env_var(name='RABBITMQ_USER', default='openvino')
BROKER_VHOST = get_env_var(name='RABBITMQ_VHOST', default='openvino_vhost')
BROKER_PASSWORD = get_env_var(name='RABBITMQ_PASSWORD', default='openvino')

DISABLE_JUPYTER = get_env_var(name='DISABLE_JUPYTER', default=0, cast_function=int) == 1

PYTHON_WRAPPER = get_env_var(name='PYTHON_WRAPPER', default=0, cast_function=int) == 1

DEFAULT_USERNAME = 'workbench_user'
DEFAULT_SALT_SIZE = 8
DEFAULT_TOKEN_SIZE = 32
USER_TOKEN_DEFAULT_DIR = os.path.join(ESSENTIAL_DATA_FOLDER, 'users')
TOKEN_FILE_DIR = get_env_var(name='WORKBENCH_PUBLIC_DIR', default=USER_TOKEN_DEFAULT_DIR)
TOKEN_FILENAME = 'token.txt'

ENABLE_AUTH = get_env_var(name='ENABLE_AUTH', default=0, cast_function=int) == 1
CUSTOM_TOKEN = get_env_var(name='CUSTOM_TOKEN')

WORKBENCH_HIDDEN_FOLDER = '.workbench'
PYTHON_VIRTUAL_ENVIRONMENT_DIR = 'python_virtual_environment'
ROOT_TMP_FOLDER = '/tmp'
JOB_FINISH_MARKER = 'SCRIPT SUCCESSFULLY FINISHED'
NO_SUDO_SETUP_MESSAGE = 'The target does not have the sudo package installed.'

EXEC_GRAPH_FILE_NAME = 'exec_graph.xml'
BENCHMARK_REPORT_FILE_NAME = 'benchmark_report.csv'

DEFAULT_USER_ON_TARGET = 'openvino'
DEFAULT_PORT_ON_TARGET = 22

BASE_PREFIX = get_env_var(name='BASE_PREFIX', default='/')

CLOUD_SERVICE_API_PREFIX = 'api/v1'
CLOUD_SERVICE_URL = get_env_var(name='CLOUD_SERVICE_URL')
CLOUD_SERVICE_HOST = None
CLOUD_SERVICE_PORT = None
# dev cloud session duration in minutes
CLOUD_SERVICE_SESSION_TTL_MINUTES = None

if CLOUD_SERVICE_URL:
    CLOUD_SERVICE_HOST, CLOUD_SERVICE_PORT = parse_host_port_from_url(CLOUD_SERVICE_URL)
    CLOUD_SERVICE_SESSION_TTL_MINUTES = get_env_var(name='CLOUD_SERVICE_SESSION_TTL_MINUTES', cast_function=int)

WORKBENCH_NETWORK_ALIAS = get_env_var(name='NETWORK_ALIAS', default='localhost')

REQUEST_TIMEOUT_SECONDS = 10
TOO_MANY_REQUESTS_CODE = 429

CELERY_RETRY_COUNTDOWN = 10
CELERY_RETRY_MAX_RETRY = 20

FILE_UPLOAD_RETRY_COUNTDOWN = 2
FILE_UPLOAD_MAX_RETRY = 500

MODEL_OPTIMIZER_RETRY_COUNTDOWN = 2
MODEL_OPTIMIZER_MAX_RETRY = 1000

GENERAL_URL_TO_CHECK_CONNECTION = 'http://www.google.com/'
PRC_URL_TO_CHECK_CONNECTION = 'https://www.tianyancha.com/'
PYPI_MIRROR_FOR_PRC = 'https://mirrors.aliyun.com/pypi/simple/'

OPENVINO_ROOT_PATH = INTEL_OPENVINO_DIR
WHEELS_FOLDER_PATH = os.path.join(ROOT_FOLDER, 'wheels')
WHEELS_NAMES = find_openvino_wheels_by_python_version(WHEELS_FOLDER_PATH)
RUNTIME_OPENVINO_WHEELS = find_runtime_openvino_wheels(WHEELS_FOLDER_PATH)
RUNTIME_OPENVINO_WHEELS_PATHS = [os.path.join(WHEELS_FOLDER_PATH, wheel_name) for wheel_name in RUNTIME_OPENVINO_WHEELS]
OPENVINO_RUNTIME_WHEEL = os.path.join(WHEELS_FOLDER_PATH, WHEELS_NAMES[OpenVINOWheelsEnum.ov_runtime_wheel])
OPENVINO_DEV_WHEEL = os.path.join(WHEELS_FOLDER_PATH, WHEELS_NAMES[OpenVINOWheelsEnum.ov_dev_wheel])
PYTHON_VERSION = f'python{sys.version_info.major}.{sys.version_info.minor}'

if SERVER_MODE == 'development':
    PATH_TO_ENV = Path(sys.executable).parent.parent
    PYTHON_PACKAGES_PATH = os.path.join(PATH_TO_ENV, 'lib', PYTHON_VERSION, 'site-packages')
else:
    PYTHON_PACKAGES_PATH = site.getsitepackages()[0]  # equals to /usr/local/lib/python{VERSION}/dist-packages

OPENVINO_PYTHON_PACKAGE_PATH = os.path.join(PYTHON_PACKAGES_PATH, 'openvino')
OPENVINO_PYTHON_TOOLS_PATH = os.path.join(OPENVINO_PYTHON_PACKAGE_PATH, 'tools')
OPEN_MODEL_ZOO_PATH = os.path.join(OPENVINO_PYTHON_PACKAGE_PATH, 'model_zoo')
OPEN_MODEL_ZOO_MODELS_PATH = Path(os.path.join(OPEN_MODEL_ZOO_PATH, 'models'))
APP_DIR = Path(__file__).parent.parent.resolve()
ACCURACY_CHECKER_PATH = os.path.join(OPENVINO_PYTHON_TOOLS_PATH, 'accuracy_checker')
DATASET_DEFINITIONS_PATH = os.path.join(OPEN_MODEL_ZOO_PATH, 'data', 'dataset_definitions.yml')
MODEL_OPTIMIZER_PATH = os.path.join(OPENVINO_PYTHON_TOOLS_PATH, 'mo')

PREDEFINED_TRANSFORMATIONS_CONFIGS = find_predefined_transformations_configs(MODEL_OPTIMIZER_PATH)

PREDEFINED_CONFIG_NAMES_TO_PATH_MAP = {item['name']: item['path'] for item in PREDEFINED_TRANSFORMATIONS_CONFIGS}

SHORT_TRANSFORMATIONS_CONFIGS = [{k: v for k, v in config.items() if k != 'path'}
                                 for config in PREDEFINED_TRANSFORMATIONS_CONFIGS]

PRECISION_TO_DATA_TYPE_ALIASES = {
    'FP32': ['FP32', 'float', 'F32'],
    'FP16': ['FP16', 'half', 'F16'],
    'I64': ['I64', 'INT64', 'int64'],
    'I32': ['I32', 'INT32', 'int32', 'U32', 'UI32'],
    'I16': ['I16', 'INT16', 'int16', 'U16', 'UI16'],
    'I8': ['I8', 'INT8', 'int8', 'U8', 'UI8'],
    'BOOL': ['BIN', 'bin', 'bool', 'INT1', 'int1', 'I1', 'U1', 'BOOLEAN'],
}

DATA_TYPE_TO_PRECISION = {
    alias: data_type
    for data_type, aliases in PRECISION_TO_DATA_TYPE_ALIASES.items()
    for alias in aliases
}

PRECISION_TO_CLIENT_REPRESENTATION_ALIASES = {
    'FP32': ['FP32', 'float', 'F32', 'I32', 'INT32', 'int32', 'U32', 'UI32'],
    'FP16': ['FP16', 'half', 'F16', 'I16', 'INT16', 'int16', 'U16', 'UI16'],
    'I8': ['I8', 'INT8', 'int8', 'U8', 'UI8'],
    'BOOL': ['BIN', 'bin', 'bool', 'INT1', 'int1', 'I1'],
}

PRECISION_TO_CLIENT_REPRESENTATION = {
    precision: client_representation
    for client_representation, precisions in PRECISION_TO_CLIENT_REPRESENTATION_ALIASES.items()
    for precision in precisions
}

INTERMEDIATE_DIR_FOR_AA_ALGORITHM = 'intermediate'
POT_RESULT_OPTIMIZED_DIR = 'optimized'

ENABLED_FEATURE_PREVIEW_FILE = Path(ROOT_FOLDER) / '.features.json'

FOLDER_PERMISSION = 0o775  # rwxrwxr-x
FILE_PERMISSION = 0o664  # rw-rw-r--

DATASET_LABELS_PATH = os.path.join(ROOT_FOLDER, 'wb', 'main', 'accuracy_utils', 'yml_templates', 'datasets_labels')

EXTRA_REQUIREMENTS_DIRECTORY_PATH = Path(ROOT_FOLDER) / 'requirements' / 'extra'

DL_WB_LOGO = r'''
    ____  __       _       __           __   __                    __  
   / __ \/ /      | |     / /___  _____/ /__/ /_  ___  ____  _____/ /_ 
  / / / / /       | | /| / / __ \/ ___/ //_/ __ \/ _ \/ __ \/ ___/ __ \
 / /_/ / /___     | |/ |/ / /_/ / /  / ,< / /_/ /  __/ / / / /__/ / / /
/_____/_____/     |__/|__/\____/_/  /_/|_/_.___/\___/_/ /_/\___/_/ /_/ 

'''
