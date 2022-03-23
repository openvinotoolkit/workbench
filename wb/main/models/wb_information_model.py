"""
 OpenVINO DL Workbench
 Class for ORM model described User

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
