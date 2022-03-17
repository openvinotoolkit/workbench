"""
 OpenVINO DL Workbench
 Init workbench session data

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
