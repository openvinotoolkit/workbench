"""
 OpenVINO DL Workbench
 Common functions for work with the database

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
