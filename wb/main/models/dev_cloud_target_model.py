"""
 OpenVINO DL Workbench
 Class for ORM model describing a Host on the DevCloud service

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
from datetime import datetime
try:
    from typing import TypedDict
except ImportError:
    from typing_extensions import TypedDict

from sqlalchemy import Column, Integer, ForeignKey, Boolean

from config.constants import DEFAULT_USER_ON_TARGET, DEFAULT_PORT_ON_TARGET
from wb.main.enumerates import TargetTypeEnum, TargetStatusEnum, TargetOSEnum
from wb.main.models.target_model import TargetModel


class DevCloudTargetData(TypedDict):
    host: str
    operatingSystem: TargetOSEnum


class DevCloudTargetModel(TargetModel):
    __tablename__ = 'dev_cloud_targets'

    __mapper_args__ = {
        'polymorphic_identity': TargetTypeEnum.dev_cloud
    }

    id = Column(Integer, ForeignKey(TargetModel.id), primary_key=True)
    inactive = Column(Boolean, nullable=False, default=False)

    def __init__(self, data: DevCloudTargetData):
        self.host = data['host']
        self.name = self.host
        self.port = DEFAULT_PORT_ON_TARGET
        self.username = DEFAULT_USER_ON_TARGET
        self.operating_system = data.get('operatingSystem', TargetOSEnum.ubuntu18)

    @property
    def last_connected(self) -> datetime:
        return self.creation_timestamp

    @property
    def last_connection_status(self) -> TargetStatusEnum:
        if self.inactive:
            return TargetStatusEnum.not_configured
        return TargetStatusEnum.available
