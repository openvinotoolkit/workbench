"""
 OpenVINO DL Workbench
 Class for ORM model describing job for getting system resources from target

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
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel
from wb.main.models.remote_target_model import RemoteTargetModel
from wb.main.models.target_model import TargetModel


class GetSystemResourcesJobModel(JobsModel):
    __tablename__ = 'get_system_resources_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.get_system_resources_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)

    target_id = Column(Integer, ForeignKey(TargetModel.id))

    target: RemoteTargetModel = relationship('RemoteTargetModel', foreign_keys=[target_id],
                                             backref=backref('get_system_resources_job',
                                                             lazy='subquery',
                                                             cascade='delete,all'))

    def __init__(self, data: dict):
        super().__init__(data)
        self.target_id = data['targetId']

    def json(self) -> dict:
        return {
            **super().json(),
            'targetId': self.target_id,
        }
