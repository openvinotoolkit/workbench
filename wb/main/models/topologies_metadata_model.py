"""
 OpenVINO DL Workbench
 An ORM entity that stores topology metadata.

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
from typing import TypedDict, List

from sqlalchemy import Integer, Column, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON

from wb.main.enumerates import TaskMethodEnum
from wb.main.models.base_model import BaseModel
from wb.main.models.enumerates import TASK_ENUM_SCHEMA, TASK_METHOD_ENUM_SCHEMA
from wb.main.shared.enumerates import TaskEnum

DEFAULT_ACCURACY_CONFIGURATION = json.dumps({
    'taskType': TaskEnum.generic.value,
    'taskMethod': TaskMethodEnum.generic.value,
    'annotationConversion': {},
    'adapterConfiguration': {},
    'preprocessing': [
        {
            'type': 'auto_resize',
        },
    ],
    'postprocessing': [],
    'metric': [],
})

DEFAULT_VISUALIZATION_CONFIGURATION = json.dumps({
    'taskType': TaskEnum.generic.value,
    'taskMethod': TaskMethodEnum.generic.value,
    'adapterConfiguration': {},
    'preprocessing': [
        {
            'type': 'auto_resize',
        },
    ],
    'postprocessing': [],
})


class InputLayoutConfiguration(TypedDict):
    name: str
    index: int
    layout: List[str]


class TopologiesMetaDataModel(BaseModel):
    __tablename__ = 'topologies_metadata'

    id = Column(Integer, primary_key=True, autoincrement=True)

    topology_type = Column(TASK_METHOD_ENUM_SCHEMA, nullable=True)
    task_type = Column(TASK_ENUM_SCHEMA, nullable=True)
    advanced_configuration = Column(Text, nullable=True, default=DEFAULT_ACCURACY_CONFIGURATION)
    visualization_configuration = Column(Text, nullable=True, default=DEFAULT_VISUALIZATION_CONFIGURATION)
    inputs = Column(Text, nullable=True)
    layout_configuration = Column(JSON, nullable=True)

    topologies = relationship('TopologiesModel', back_populates='meta', lazy='joined')

    def json(self) -> dict:
        return {
            'layoutConfiguration': self.layout_configuration,
            'taskType': self.task_type.value if self.task_type else None,
            'taskMethod': self.topology_type.value if self.topology_type else None,
            **(json.loads(self.advanced_configuration) if self.advanced_configuration else {})
        }

    def visualization_configuration_json(self) -> dict:
        return json.loads(self.visualization_configuration) if self.visualization_configuration else {}
