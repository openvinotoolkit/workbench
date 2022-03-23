"""
 OpenVINO DL Workbench
 Class for ORM model described an Annotate Dataset Job

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
from wb.main.models.datasets_model import DatasetsModel
from wb.main.models.jobs_model import JobsModel, JobData


class AnnotateDatasetJobData(JobData):
    resultDatasetId: int


class AnnotateDatasetJobModel(JobsModel):
    __tablename__ = 'annotate_dataset_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.annotate_dataset.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    result_dataset_id = Column(Integer, ForeignKey(DatasetsModel.id), nullable=False)

    result_dataset: DatasetsModel = relationship(DatasetsModel, foreign_keys=[result_dataset_id],
                                                 backref=backref('annotate_dataset_job', lazy='subquery',
                                                                 cascade='delete,all', uselist=False))

    def __init__(self, data: AnnotateDatasetJobData):
        super().__init__(data)
        self.result_dataset_id = data.get('resultDatasetId')

    def json(self) -> dict:
        return {
            **super().json(),
            'resultDatasetPath': self.result_dataset.path,
            'dataset': self.result_dataset.json()
        }
