"""
 OpenVINO DL Workbench
 Class for ORM model describing job for apply shape for the model

 Copyright (c) 2020 Intel Corporation

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
from typing import List, TypedDict

from sqlalchemy import Column, Integer, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship, backref
from sqlalchemy.dialects.postgresql import JSON

from wb.main.enumerates import ModelShapeTypeEnum, StatusEnum
from wb.main.models import STATUS_ENUM_SCHEMA
from wb.main.models.base_model import BaseModel
from wb.main.models.topologies_model import TopologiesModel


class InputShapeConfiguration(TypedDict):
    name: str
    index: int
    shape: List[int]


class ModelShapeConfigurationModel(BaseModel):
    __tablename__ = 'model_shape_configurations'

    __mapper_args__ = {
        'polymorphic_identity': __tablename__
    }

    id = Column(Integer, primary_key=True, autoincrement=True)

    status = Column(STATUS_ENUM_SCHEMA, nullable=True, default=StatusEnum.queued)

    model_id = Column(Integer, ForeignKey(TopologiesModel.id), nullable=False)
    is_original = Column(Boolean, nullable=False, default=True)

    shape_configuration = Column(JSON, nullable=True)

    model = relationship(
        TopologiesModel, lazy='subquery',
        backref=backref('shapes', cascade='all,delete-orphan', lazy='subquery', uselist=True, )
    )

    def __init__(self, model_id: int, shape_configuration: List, is_original: bool = True):
        self.model_id = model_id
        self.shape_configuration = shape_configuration
        self.is_original = is_original

    def json(self) -> dict:
        return {
            'id': self.id,
            'shapeConfiguration': self.shape_configuration,
            'type': self.shape_type.value,
            'isOriginal': self.is_original
        }

    @property
    def shape_type(self) -> ModelShapeTypeEnum:
        for input_configuration in self.shape_configuration:
            if -1 in input_configuration['shape']:
                return ModelShapeTypeEnum.dynamic
        return ModelShapeTypeEnum.static
