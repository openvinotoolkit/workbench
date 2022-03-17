"""
 OpenVINO DL Workbench
 Class for ORM model describing a Host on the DevCloud service

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
