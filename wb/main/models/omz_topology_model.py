"""
 OpenVINO DL Workbench
 Class for ORM model described a Model

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
import json
from typing import Optional

from sqlalchemy import Column, Integer, Text, String

from wb.main.enumerates import TaskMethodEnum
from wb.main.models.base_model import BaseModel
from wb.main.models.enumerates import TASK_ENUM_SCHEMA, TASK_METHOD_ENUM_SCHEMA, SUPPORTED_FRAMEWORKS_ENUM_SCHEMA
from wb.main.shared.enumerates import TaskEnum


class OMZTopologyModel(BaseModel):
    __tablename__ = 'omz_topologies'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    framework = Column(SUPPORTED_FRAMEWORKS_ENUM_SCHEMA, nullable=False)
    license_url = Column(String, nullable=False)
    path = Column(String, nullable=False)
    task_type = Column(TASK_ENUM_SCHEMA, nullable=False)
    topology_type = Column(TASK_METHOD_ENUM_SCHEMA, nullable=False)
    advanced_configuration = Column(Text, nullable=True)
    source = Column(Text, nullable=True)
    inputs = Column(Text, nullable=True)

    precisions: 'ModelPrecisionsModel'

    def __init__(self, data: dict, task_type: TaskEnum, topology_type: TaskMethodEnum,
                 advanced_configuration: dict, source: Optional[str], inputs: Optional[list]):
        self.name = data['name']
        self.description = data['description']
        self.framework = data['framework']
        self.license_url = data['license_url']
        self.path = data['subdirectory']
        self.task_type = task_type
        self.topology_type = topology_type
        self.advanced_configuration = json.dumps(advanced_configuration)
        self.source = source
        if inputs:
            self.inputs = json.dumps(inputs)

    def json(self):
        return {
            'name': self.name,
            'description': self.description,
            'framework': self.framework.value,
            'license_url': self.license_url,
            'path': self.path,
            'task_type': self.task_type.value,
            'topology_type': self.topology_type.value,
            'advanced_configuration': json.loads(self.advanced_configuration)
        }
