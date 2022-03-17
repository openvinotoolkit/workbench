"""
 OpenVINO DL Workbench
 Entry point for launching profiler BE

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
