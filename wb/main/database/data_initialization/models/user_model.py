"""
 OpenVINO DL Workbench
 Init user model data

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
import secrets

from flask import current_app
from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_session_for_app

from wb.main.models.user_metadata_model import UserMetadataModel
from wb.main.models.users_model import UsersModel
from wb.main.utils.utils import generate_token_or_get_from_file
from wb.utils.utils import update_url_token
from config.constants import DEFAULT_USERNAME, DEFAULT_TOKEN_SIZE, CLOUD_SERVICE_URL


def init(session: Session):
    if session.query(UsersModel).first():
        update_url_token(get_db_session_for_app())
        return

    login_token = generate_token_or_get_from_file()
    url_token = secrets.token_hex(DEFAULT_TOKEN_SIZE)
    current_app.config.url_token = url_token
    generated_user = UsersModel(username=DEFAULT_USERNAME, login_token=login_token, url_token=url_token)
    generated_user.write_record(session)

    # generating meta here as we assume that currently there is only one default user
    is_dev_cloud_mode = bool(CLOUD_SERVICE_URL)
    user = session.query(UsersModel).one()
    user_meta = UserMetadataModel(user_id=user.id, viewed_warning=is_dev_cloud_mode)
    user_meta.write_record(session)
