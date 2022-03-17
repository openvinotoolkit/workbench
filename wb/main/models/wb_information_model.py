"""
 OpenVINO DL Workbench
 Class for ORM model described User

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
import os

from sqlalchemy import Boolean, Column, String, Integer

from config.constants import ROOT_FOLDER
from wb.main.models.base_model import BaseModel


class WBInfoModel(BaseModel):
    __tablename__ = 'wb_info'

    develop_version = 'develop'

    id = Column(Integer, primary_key=True, autoincrement=True)
    version = Column(String, nullable=False)

    dev_cloud_user = Column(String, nullable=True)
    dev_cloud_file_system_prefix = Column(String, nullable=True)
    is_prc = Column(Boolean, nullable=True, default=False)

    def __init__(self, version: str = develop_version):
        self.version = version

    @staticmethod
    def get_version_from_file() -> str:
        version_txt_path = os.path.join(ROOT_FOLDER, 'version.txt')
        if not os.path.isfile(version_txt_path):
            return WBInfoModel.develop_version
        with open(version_txt_path, 'r') as file_descr:
            lines = file_descr.readlines()
        return lines[0]
