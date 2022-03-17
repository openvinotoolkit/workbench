"""
 OpenVINO DL Workbench
 Endpoints to work with environments

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

from flask import jsonify

from wb.extensions_factories.database import get_db_session_for_app
from wb.main.api_endpoints.v1 import V1_ENVIRONMENT_API
from wb.main.environment.handler import EnvironmentAPIHandler
from wb.main.utils.safe_runner import safe_run


@V1_ENVIRONMENT_API.route('/environment/frameworks/status')
@safe_run
def get_all_environments():
    session = get_db_session_for_app()
    return jsonify(EnvironmentAPIHandler.get_framework_specific_environments_status(session=session))


@V1_ENVIRONMENT_API.route('environment/setup/stop', methods=['DELETE'])
@safe_run
def stop_setup_environment():
    session = get_db_session_for_app()
    return jsonify(EnvironmentAPIHandler.stop_all_running_environments(session))
