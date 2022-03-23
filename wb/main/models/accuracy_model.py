"""
 OpenVINO DL Workbench
 Class for ORM model described an Accuracy Job

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
from sqlalchemy import Column, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum, AccuracyReportTypeEnum
from wb.main.models.enumerates import ACCURACY_REPORT_TYPE_ENUM
from wb.main.models.jobs_model import JobsModel, JobData


# TODO Consider renaming to AccuracyReportJobData
class AccuracyJobData(JobData):
    targetDatasetId: int
    reportType: AccuracyReportTypeEnum


# TODO Consider renaming to AccuracyJobModel or CreateAccuracyReportJobModel and rename file to accuracy_job_model.py
class AccuracyJobsModel(JobsModel):
    __tablename__ = 'accuracy_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.accuracy_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)

    accuracy_config = Column(Text, nullable=True)

    accuracy_report_type = Column(ACCURACY_REPORT_TYPE_ENUM, nullable=True)

    target_dataset_id = Column(Integer, ForeignKey('datasets.id'), nullable=False)

    target_dataset: 'DatasetsModel' = relationship('DatasetsModel', foreign_keys=[target_dataset_id],
                                                   backref=backref('accuracy_job', lazy='subquery',
                                                                   cascade='delete,all', uselist=False))

    def __init__(self, data: AccuracyJobData):
        super().__init__(data)
        self.target_dataset_id = data['targetDatasetId']
        self.accuracy_report_type = data['reportType']

    def json(self) -> dict:
        return {
            **super().json(),
            'jobId': self.job_id,
            'targetDatasetId': self.target_dataset_id,
            'accuracy_config': self.accuracy_config,
            'accuracyReportType': self.accuracy_report_type.value,
        }
