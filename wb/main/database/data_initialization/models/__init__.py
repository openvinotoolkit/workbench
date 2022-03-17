"""
 OpenVINO DL Workbench
 Module for database data initialization

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
from contextlib import closing

from wb.main.database.data_initialization.models import local_target_model, user_model, wb_information_model
from wb.extensions_factories.database import get_db_session_for_app


def initialize(application):
    with application.app_context():
        with closing(get_db_session_for_app()) as session:
            wb_information_model.init(session)
            local_target_model.init(session)
            user_model.init(session)
