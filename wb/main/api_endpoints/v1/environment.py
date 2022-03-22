"""
 OpenVINO DL Workbench
 Endpoints to work with environments

 Copyright (c) 2021 Intel Corporation

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
