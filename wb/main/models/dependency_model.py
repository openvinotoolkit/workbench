"""
 OpenVINO DL Workbench
 Class for ORM model described a Dependency of Environment

 Copyright (c) 2021 Intel Corporation

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
