"""
 OpenVINO DL Workbench
 Class for ORM model describing job for apply shape for the model

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

from sqlalchemy import Column, Integer, ForeignKey, Boolean
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.topologies_model import TopologiesModel
from wb.main.models.jobs_model import JobsModel, JobData
from wb.main.models.model_shape_configuration_model import ModelShapeConfigurationModel


class ReshapeModelJobData(JobData):
    model_id: int
    shape_model_configuration_id: int
    save_reshaped_model: bool


class ReshapeModelJobModel(JobsModel):
    __tablename__ = 'reshape_model_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.reshape_model.value
    }
    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)

    model_id = Column(Integer, ForeignKey(TopologiesModel.id), nullable=False)
    shape_model_configuration_id = Column(Integer, ForeignKey(ModelShapeConfigurationModel.id), nullable=False)
    save_reshaped_model = Column(Boolean, nullable=False, default=False)

    model: TopologiesModel = relationship(
        TopologiesModel, lazy='subquery',
        backref=backref(
            'apply_shape_job', cascade='all,delete-orphan',
            lazy='subquery'
        )
    )

    shape_model_configuration: ModelShapeConfigurationModel = relationship(
        ModelShapeConfigurationModel, lazy='subquery',
        backref=backref(
            'apply_shape_job', cascade='all,delete-orphan',
            lazy='subquery'
        )
    )

    def __init__(self, data: ReshapeModelJobData):
        super().__init__(data)
        self.model_id = data['model_id']
        self.shape_model_configuration_id = data['shape_model_configuration_id']
        self.save_reshaped_model = data['save_reshaped_model']

    def json(self) -> dict:
        return {
            **super().json(),
            'modelId': self.model_id,
            'shapeConfiguration': self.shape_model_configuration.json(),
        }

