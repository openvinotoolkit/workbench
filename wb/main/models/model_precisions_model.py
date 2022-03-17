"""
 OpenVINO DL Workbench
 ORM model to store model precisions.

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
