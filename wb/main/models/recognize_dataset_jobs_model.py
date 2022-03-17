"""
 OpenVINO DL Workbench
 Class for ORM model described an dataset recognizer job

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
from wb.main.models.datasets_model import DatasetJobData, DatasetsModel
from wb.main.models.jobs_model import JobsModel


class RecognizeDatasetJobsModel(JobsModel):
    __tablename__ = 'recognize_dataset_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.recognize_dataset_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    dataset_id = Column(Integer, ForeignKey(DatasetsModel.id), nullable=False)

    dataset: DatasetsModel = relationship(DatasetsModel, foreign_keys=[dataset_id],
                                          backref=backref('recognize_dataset_job', lazy='subquery',
                                                          cascade='delete,all', uselist=False))

    def __init__(self, data: DatasetJobData):
        super().__init__(data)
        self.dataset_id = data['datasetId']

    def json(self) -> dict:
        return {
            **super().json(),
            **self.dataset.json()
        }
