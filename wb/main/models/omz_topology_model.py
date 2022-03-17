"""
 OpenVINO DL Workbench
 Class for ORM model described a Model

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
