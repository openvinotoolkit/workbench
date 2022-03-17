"""
 OpenVINO DL Workbench
 Class for ORM model described an dataset validator job

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""

from sqlalchemy import Integer, Column, ForeignKey
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models import JobsModel, DatasetsModel, TASK_ENUM_SCHEMA
from wb.main.models.datasets.datasets_model import DatasetJobData, TextDatasetJobData


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
