"""
 OpenVINO DL Workbench
 Class for ORM model described an Annotate Dataset Job

 Copyright (c) 2021 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.datasets.datasets_model import DatasetsModel
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
