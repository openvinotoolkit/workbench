"""
 OpenVINO DL Workbench
 Module for database data initialization

 Copyright (c) 2020 Intel Corporation

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
from contextlib import closing

from wb.main.database.data_initialization.models import local_target_model, user_model, wb_information_model
from wb.extensions_factories.database import get_db_session_for_app


def initialize(application):
    with application.app_context():
        with closing(get_db_session_for_app()) as session:
            wb_information_model.init(session)
            local_target_model.init(session)
            user_model.init(session)
