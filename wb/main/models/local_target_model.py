"""
 OpenVINO DL Workbench
 Class for ORM model describing a local target machine

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
from pathlib import Path
from typing import Optional

from sqlalchemy import Column, Integer, ForeignKey

from config.constants import DEFAULT_USER_ON_TARGET, DEFAULT_PORT_ON_TARGET, JOBS_SCRIPTS_FOLDER
from wb.main.enumerates import TargetTypeEnum, TargetStatusEnum
from wb.main.models.target_model import TargetModel


class LocalTargetModel(TargetModel):
    __tablename__ = 'local_targets'

    __mapper_args__ = {
        'polymorphic_identity': TargetTypeEnum.local
    }

    id = Column(Integer, ForeignKey(TargetModel.id), primary_key=True)

    def __init__(self, cpu_info_id: int, system_resources_id: int):
        self.name = 'Local Workstation'
        self.host = '127.0.0.1'
        self.port = DEFAULT_PORT_ON_TARGET
        self.username = DEFAULT_USER_ON_TARGET
        self.system_resources_id = system_resources_id
        self.cpu_info_id = cpu_info_id

    @property
    def last_connected(self) -> Optional[datetime]:
        return self.creation_timestamp

    @property
    def last_connection_status(self) -> TargetStatusEnum:
        return TargetStatusEnum.available

    @property
    def bundle_path(self) -> str:
        return str(Path(JOBS_SCRIPTS_FOLDER).parent)
