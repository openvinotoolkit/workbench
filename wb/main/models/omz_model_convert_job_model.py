"""
 OpenVINO DL Workbench
 Class for ORM model described an Datasets

 Copyright (c) 2018 Intel Corporation

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

from sqlalchemy import Integer, Column, ForeignKey, Text
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel
from wb.main.models.topologies_model import ModelJobData, TopologiesModel


class OMZModelConvertJobModel(JobsModel):
    __tablename__ = 'omz_model_convert_jobs'
    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.omz_model_convert_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    result_model_id = Column(Integer, ForeignKey(TopologiesModel.id), nullable=True)
    conversion_args = Column(Text, nullable=True)

    model = relationship(TopologiesModel, foreign_keys=[result_model_id],
                                backref=backref('model_downloader_converter_job',
                                                lazy='subquery', cascade='delete,all'))

    def __init__(self, data: ModelJobData):
        super().__init__(data)
        self.result_model_id = data['modelId']

    def json(self):
        return {
            'path': self.path,
            'args': self.conversion_args
        }

    @property
    def path(self) -> str:
        return self.model.path
