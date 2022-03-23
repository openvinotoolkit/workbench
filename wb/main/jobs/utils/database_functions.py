"""
 OpenVINO DL Workbench
 Common functions for work with the database

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
from typing import List

from sqlalchemy.orm import Session

from wb.main.models.base_model import BaseModel
from wb.main.enumerates import StatusEnum
from wb.main.enumerates import STATUS_PRIORITY


def set_status_in_db(table: type(BaseModel), item_id: int, status: StatusEnum,
                     session: Session, message: str = None, force: bool = False):
    record = session.query(table).get(item_id)

    if record:
        record = set_status(record, status, message, force)
        record.write_record(session)


def set_statuses_in_db(records: List[BaseModel], status: StatusEnum, session: Session, message: str = None,
                       force: bool = False):
    if not records:
        return
    for record in records:
        record = set_status(record, status, message, force)
        session.add(record)
    session.commit()


def set_status(record: BaseModel, status: StatusEnum, message: str = None, force: bool = False) -> BaseModel:
    if record and (force or STATUS_PRIORITY[record.status] < STATUS_PRIORITY[status]):
        record.status = status
        if status == StatusEnum.ready:
            record.progress = 100
        if message:
            record.error_message = message
    return record
