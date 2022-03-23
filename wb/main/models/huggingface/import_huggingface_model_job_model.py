"""
 OpenVINO DL Workbench
 ImportHuggingfaceJobModel

 Copyright (c) 2022 Intel Corporation

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

from sqlalchemy import Integer, Column, ForeignKey, String
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel
from wb.main.models.topologies_model import TopologiesModel, ModelJobData


class ImportHuggingfaceJobData(ModelJobData):
    huggingface_model_id: str


class ImportHuggingfaceJobModel(JobsModel):
    __tablename__ = 'import_huggingface_model_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.import_huggingface_model_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    model_id = Column(Integer, ForeignKey(TopologiesModel.id), nullable=False)
    huggingface_model_id = Column(String, nullable=False)

    model: TopologiesModel = relationship(TopologiesModel, foreign_keys=[model_id],
                                          backref=backref('import_huggingface_model_job', lazy='subquery',
                                                          cascade='delete,all', uselist=False))

    def __init__(self, data: ImportHuggingfaceJobData):
        super().__init__(data)
        self.model_id = data['modelId']
        self.huggingface_model_id = data['huggingface_model_id']
