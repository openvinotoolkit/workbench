"""
 OpenVINO DL Workbench
 Class for ORM model described a Dependency of Environment

 Copyright (c) 2021 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, backref

from wb.main.models.environment_model import EnvironmentModel
from wb.main.models.base_model import BaseModel


class DependencyModel(BaseModel):
    __tablename__ = 'dependencies'

    id = Column(Integer, primary_key=True, autoincrement=True)

    package = Column(String, nullable=False)
    version = Column(String, nullable=False)

    environment_id = Column(Integer, ForeignKey(EnvironmentModel.id), nullable=False)
    environment = relationship(EnvironmentModel,
                               backref=backref('dependencies', lazy='subquery', cascade='delete,all',
                                               uselist=True))

    def __init__(self, package: str, version: str, environment_id: int):
        self.package = package
        self.version = version
        self.environment_id = environment_id

    def json(self) -> dict:
        return {
            'package': self.package,
            'version': self.version,
        }
