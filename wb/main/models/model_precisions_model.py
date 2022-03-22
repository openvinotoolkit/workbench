"""
 OpenVINO DL Workbench
 ORM model to store model precisions.

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
from sqlalchemy import Integer, Column, ForeignKey
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import ModelPrecisionEnum
from wb.main.models.omz_topology_model import OMZTopologyModel
from wb.main.models.base_model import BaseModel
from wb.main.models.enumerates import MODEL_PRECISION_ENUM_SCHEMA


class ModelPrecisionsModel(BaseModel):
    __tablename__ = 'model_precisions'

    id = Column(Integer, primary_key=True)
    topology_id = Column(Integer, ForeignKey(OMZTopologyModel.id), nullable=False)
    precision = Column(MODEL_PRECISION_ENUM_SCHEMA, nullable=False)

    model = relationship(OMZTopologyModel,
                         backref=backref('precisions', lazy='subquery'),
                         foreign_keys=[topology_id],
                         cascade='delete,all')

    def __init__(self, topology_id, precision: ModelPrecisionEnum):
        self.topology_id = topology_id
        self.precision = precision
