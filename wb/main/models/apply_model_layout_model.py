"""
 OpenVINO DL Workbench
 Class for ORM model describing job for apply layout for the model

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
from sqlalchemy.dialects.postgresql import JSON

from wb.main.enumerates import JobTypesEnum
from wb.main.models.topologies_model import TopologiesModel
from wb.main.models.jobs_model import JobsModel, JobData


class ApplyModelLayoutJobData(JobData):
    model_id: int
    layout: dict


class ApplyModelLayoutJobModel(JobsModel):
    __tablename__ = 'apply_model_layout_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.apply_model_layout.value
    }
    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)

    model_id = Column(Integer, ForeignKey(TopologiesModel.id), nullable=False)
    layout = Column(JSON, nullable=True)

    model = relationship(
        TopologiesModel, lazy='subquery',
        backref=backref(
            'apply_model_layout_jobs', cascade='all,delete-orphan',
            lazy='subquery', uselist=True
        ),
        uselist=False
    )

    def __init__(self, data: ApplyModelLayoutJobData):
        super().__init__(data)
        self.model_id = data['model_id']
        self.layout = data['layout']

    def json(self) -> dict:
        return {
            **super().json(),
            'modelId': self.model_id,
            'layout': self.layout,
        }
