"""
 OpenVINO DL Workbench
 Base Class for ORM models

 Copyright (c) 2018 Intel Corporation

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
