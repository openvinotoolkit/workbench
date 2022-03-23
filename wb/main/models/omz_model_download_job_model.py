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

from sqlalchemy import String, Integer, Column, ForeignKey, Text
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel, JobData


class OMZModelDownloadJobData(JobData):
    modelId: int
    modelName: str
    precision: str
    path: str


class OMZModelDownloadJobModel(JobsModel):
    __tablename__ = 'omz_model_download_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.omz_model_download_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    name = Column(String, nullable=False)
    precision = Column(Text, nullable=False)
    result_model_id = Column(Integer, ForeignKey('topologies.id'), nullable=True)
    path = Column(String, nullable=True)

    model = relationship('TopologiesModel',
                                foreign_keys=[result_model_id],
                                backref=backref('model_downloader_job', lazy='subquery', cascade='delete,all',
                                                uselist=False))

    def __init__(self, data: OMZModelDownloadJobData):
        super().__init__(data)
        self.result_model_id = data['modelId']
        self.name = data['modelName']
        self.precision = data['precision']
        self.path = data['path']

    def json(self):
        return {
            'name': self.name,
            'precision': self.precision,
            'path': self.path,
            'resultModelId': self.result_model_id,
        }
