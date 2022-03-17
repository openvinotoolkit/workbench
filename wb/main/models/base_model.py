"""
 OpenVINO DL Workbench
 Base Class for ORM models

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
import datetime
from typing import List

from sqlalchemy import Column, DateTime
from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_for_app

DB = get_db_for_app()


class BaseModel(DB.Model):
    __abstract__ = True

    creation_timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    last_modified = Column(DateTime, onupdate=datetime.datetime.utcnow, default=datetime.datetime.utcnow)

    def write_record(self, session: Session):
        session.add(self)
        session.commit()

    @staticmethod
    def write_records(records: List['BaseModel'], session: Session):
        session.add_all(records)
        session.commit()

    def delete_record(self, session: Session):
        session.delete(self)
        session.commit()

    @staticmethod
    def delete_records(records: List['BaseModel'], session: Session):
        for i in records:
            session.delete(i)
        session.commit()

    @staticmethod
    def timestamp_to_milliseconds(timestamp: datetime.datetime) -> float:
        return timestamp.replace(tzinfo=datetime.timezone.utc).timestamp() * 1000  # Milliseconds
