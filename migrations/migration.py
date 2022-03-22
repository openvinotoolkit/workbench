"""
 OpenVINO DL Workbench
 Entry point for launching profiler BE

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

from flask_migrate import Migrate

from wb import create_app, get_config, init_db_app
from wb.extensions_factories.database import get_db_for_app
from wb.utils.logger import initialize_workbench_logger

# This is a migration entry point. Used with flask-migrate cli.
# Loads application context and inits database.

initialize_workbench_logger()

APP = create_app()

CONFIG = get_config()

APP.config.from_object(CONFIG)
init_db_app(APP)

MIGRATE = Migrate()
MIGRATE.init_app(APP, get_db_for_app())
