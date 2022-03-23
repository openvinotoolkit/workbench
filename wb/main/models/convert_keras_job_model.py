"""
 OpenVINO DL Workbench
 Class for ORM model described a keras model conversion

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
import os

from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel
from wb.main.models.topologies_model import ModelJobData


class ConvertKerasJobModel(JobsModel):
    __tablename__ = 'convert_keras_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.convert_keras_type.value
    }
    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    topology_id = Column(Integer, ForeignKey('topologies.id'), nullable=False)

    model = relationship('TopologiesModel', foreign_keys=[topology_id],
                         backref=backref('keras_convert', lazy='subquery', cascade='delete,all'))

    def __init__(self, data: ModelJobData):
        super().__init__(data)
        self.topology_id = data['modelId']

    def json(self) -> dict:
        return {
            'jobId': self.job_id,
            'topologyId': self.topology_id
        }

    @property
    def keras_file_path(self) -> str:
        return os.path.join(self.model.path, self.model.files[0].name)

    @property
    def output_path(self) -> str:
        return os.path.join(self.model.path, self.model.name)
