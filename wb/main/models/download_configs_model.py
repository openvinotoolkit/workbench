"""
 OpenVINO DL Workbench
 Class for ORM model described a dataset generation config

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

from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel


class ModelDownloadConfigsModel(JobsModel):
    __tablename__ = 'model_downloads_configs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.download_model_type.value
    }
    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    model_id = Column(Integer, ForeignKey('topologies.id'))
    name = Column(String, nullable=True)
    tab_id = Column(String, nullable=True)

    model = relationship('TopologiesModel', backref=backref('download_configs', cascade='all,delete-orphan'))

    def __init__(self, data):
        super().__init__(data)
        self.model_id = data['model_id']
        self.name = data['name']
        self.tab_id = data['tab_id']

    def json(self):
        return {
            'jobId': self.job_id,
            'artifactId': self.shared_artifact.id,
            'status': self.pipeline.status_to_json(),
            'modelId': self.model_id,
            'tabId': self.tab_id,
            'name': self.name,
        }
