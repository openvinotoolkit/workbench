"""
 OpenVINO DL Workbench
 Init workbench session data

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
from sqlalchemy.orm import Session

from wb.main.models.wb_information_model import WBInfoModel
from wb.utils.utils import is_prc


def init(session: Session):
    info: WBInfoModel = session.query(WBInfoModel).first()
    if not info:
        info = WBInfoModel()
    info.is_prc = is_prc()
    info.version = WBInfoModel.get_version_from_file()
    info.write_record(session)
