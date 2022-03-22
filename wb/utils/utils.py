"""
 OpenVINO DL Workbench
 Utilities function

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
import secrets

import requests
from flask import current_app
from sqlalchemy.orm import Session

from config.constants import (ARTIFACTS_PATH, CLOUD_SHARED_FOLDER, DEFAULT_TOKEN_SIZE, ENVIRONMENTS_FOLDER,
                              FOLDER_PERMISSION, GENERAL_URL_TO_CHECK_CONNECTION, JUPYTER_NOTEBOOKS_FOLDER,
                              MODEL_DOWNLOADS_FOLDER, PRC_URL_TO_CHECK_CONNECTION, PROFILING_ARTIFACTS_REPORT_DIR,
                              REQUEST_TIMEOUT_SECONDS, TOO_MANY_REQUESTS_CODE, UPLOAD_FOLDER_DATASETS,
                              UPLOAD_FOLDER_MODELS, USER_TOKEN_DEFAULT_DIR)
from wb.main.models import UsersModel
from wb.main.utils.safe_runner import log_traceback
from wb.main.utils.utils import print_app_url_info


def is_prc() -> bool:
    if check_connection(url=GENERAL_URL_TO_CHECK_CONNECTION):
        return False
    if check_connection(url=PRC_URL_TO_CHECK_CONNECTION):
        return True
    return False


def check_connection(url: str) -> bool:
    try:
        response = requests.get(url=url, timeout=(REQUEST_TIMEOUT_SECONDS, REQUEST_TIMEOUT_SECONDS))
        response.raise_for_status()
        # Handle too many requests error
        if response.status_code == TOO_MANY_REQUESTS_CODE:
            return True
        if response.status_code != requests.codes['ok']:
            return False
        return True
    except TypeError as error:
        # pylint: disable=fixme
        # TODO: return false once issue is resolved (https://github.com/miguelgrinberg/Flask-SocketIO/issues/1011)
        log_traceback(error)
        return True
    except Exception as error:
        log_traceback(error)
        return False


def init_data_folders():
    assets_paths = (
        ARTIFACTS_PATH, MODEL_DOWNLOADS_FOLDER, PROFILING_ARTIFACTS_REPORT_DIR,
        UPLOAD_FOLDER_DATASETS, UPLOAD_FOLDER_MODELS, JUPYTER_NOTEBOOKS_FOLDER,
        USER_TOKEN_DEFAULT_DIR, ENVIRONMENTS_FOLDER, CLOUD_SHARED_FOLDER
    )
    for path in assets_paths:
        if not path:
            continue
        os.makedirs(path, mode=FOLDER_PERMISSION, exist_ok=True)


def set_dev_cloud_availability(state: bool):
    is_dev_cloud_available.DEV_CLOUD_AVAILABILITY_STATE = state


def is_dev_cloud_available() -> bool:
    return is_dev_cloud_available.DEV_CLOUD_AVAILABILITY_STATE


is_dev_cloud_available.DEV_CLOUD_AVAILABILITY_STATE = False


def update_url_token(session: Session, is_regenerated=False):
    user_record: UsersModel = session.query(UsersModel).one()
    new_url_token = secrets.token_hex(DEFAULT_TOKEN_SIZE)
    current_app.config.url_token = new_url_token
    user_record.set_url_token(new_url_token)
    user_record.write_record(session)
    if is_regenerated:
        print_app_url_info(is_regenerated)
