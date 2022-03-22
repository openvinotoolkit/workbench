"""
 OpenVINO DL Workbench
 Class for ORM model

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
