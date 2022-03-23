"""
 OpenVINO DL Workbench
 Class for ORM model described a job to analyze model input

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
from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from wb.main.enumerates import JobTypesEnum
from wb.main.models.topologies_model import ModelJobData, TopologiesModel
from wb.main.models.jobs_model import JobsModel


class AnalyzeModelInputShapeJobModel(JobsModel):
    __tablename__ = 'analyze_model_input_shape_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.analyze_model_input_shape_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    model_id = Column(Integer, ForeignKey(TopologiesModel.id), nullable=True)

    model = relationship(TopologiesModel)

    def __init__(self, data: ModelJobData):
        super().__init__(data)
        self.model_id = data['modelId']

    def json(self):
        return {
            **(super().json()),
            'modelId': self.model_id,
        }
