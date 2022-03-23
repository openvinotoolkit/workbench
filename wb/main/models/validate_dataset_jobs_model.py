"""
 OpenVINO DL Workbench
 Class for ORM model described an dataset validator job

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

from sqlalchemy import Integer, Column, ForeignKey
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models import JobsModel, DatasetsModel, TASK_ENUM_SCHEMA
from wb.main.models.datasets_model import DatasetJobData, TextDatasetJobData


class ValidateDatasetJobsModel(JobsModel):
    __tablename__ = 'validate_dataset_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.validate_dataset_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    dataset_id = Column(Integer, ForeignKey(DatasetsModel.id), nullable=False)

    dataset: DatasetsModel = relationship(DatasetsModel, foreign_keys=[dataset_id],
                                          backref=backref('validate_dataset_job', lazy='subquery', cascade='delete,all',
                                                          uselist=False))

    def __init__(self, data: DatasetJobData):
        super().__init__(data)
        self.dataset_id = data['datasetId'] or data['resultDatasetId']

    def json(self) -> dict:
        return {
            **super().json(),
            **self.dataset.json()
        }


class ValidateTextDatasetJobsModel(ValidateDatasetJobsModel):
    __tablename__ = 'validate_text_dataset_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.validate_text_dataset_type.value
    }

    job_id = Column(Integer, ForeignKey(ValidateDatasetJobsModel.job_id), primary_key=True)
    task_type = Column(TASK_ENUM_SCHEMA, nullable=False)

    def __init__(self, data: TextDatasetJobData):
        super().__init__(data)
        self.task_type = data['task_type']
