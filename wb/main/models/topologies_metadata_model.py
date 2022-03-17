"""
 OpenVINO DL Workbench
 An ORM entity that stores topology metadata.

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
