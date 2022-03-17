"""
 OpenVINO DL Workbench
 Class for ORM model

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
from sqlalchemy import Column, Integer

from wb.main.models.base_model import BaseModel


class WorkbenchSession(BaseModel):
    __tablename__ = 'workbench_session'

    id = Column(Integer, primary_key=True, autoincrement=True)
    ttl_seconds = Column(Integer, nullable=False)

    def __init__(self, ttl_seconds: int):
        self.ttl_seconds = ttl_seconds

    def json(self) -> dict:
        return {
            'created': self.timestamp_to_milliseconds(self.creation_timestamp),
            'ttlSeconds': self.ttl_seconds
        }
