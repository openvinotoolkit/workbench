"""
 OpenVINO DL Workbench
 Class for ORM model describing job for creating int8 calibration scripts

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

from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel, JobData
from wb.main.models.topologies_model import TopologiesModel


class SetupEnvironmentJobData(JobData):
    modelId: int


class SetupEnvironmentJobModel(JobsModel):
    __tablename__ = 'setup_environment_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.setup_environment_job.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)

    model_id = Column(Integer, ForeignKey(TopologiesModel.id), nullable=False)
    model = relationship(TopologiesModel, cascade='delete,all',
                         backref=backref('setup_environment_job',
                                         lazy='subquery', cascade='delete,all'))

    def __init__(self, data: SetupEnvironmentJobData):
        super().__init__(data)
        self.model_id = data['modelId']

    def json(self) -> dict:
        return {
            **super().json(),
            'model': self.model.json()
        }
