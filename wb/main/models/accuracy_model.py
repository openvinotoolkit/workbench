"""
 OpenVINO DL Workbench
 Class for ORM model described an Accuracy Job

 Copyright (c) 2018 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
