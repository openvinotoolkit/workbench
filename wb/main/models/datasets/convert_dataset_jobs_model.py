"""
 OpenVINO DL Workbench
 Class for ORM model describing a dataset converter job

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
from sqlalchemy import Integer, Column, ForeignKey
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.datasets.datasets_model import DatasetsModel, DatasetJobData
from wb.main.models.jobs_model import JobsModel
from wb.main.models.enumerates import DATASET_TYPES_ENUM_SCHEMA


class ConvertDatasetJobsModel(JobsModel):
    __tablename__ = 'convert_dataset_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.convert_dataset_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    dataset_id = Column(Integer, ForeignKey(DatasetsModel.id), nullable=False)
    original_format = Column(DATASET_TYPES_ENUM_SCHEMA, nullable=True)
    converted_dataset_id = Column(Integer, ForeignKey(DatasetsModel.id), nullable=False)

    dataset: DatasetsModel = relationship(DatasetsModel, foreign_keys=[dataset_id],
                                          backref=backref('convert_dataset_jobs_from_original', lazy='subquery',
                                                          cascade='delete,all', uselist=False))
    # Named to be compatible with CreateDatasetDBObserver
    converted_dataset: DatasetsModel = relationship(DatasetsModel, foreign_keys=[converted_dataset_id],
                                                    backref=backref('convert_dataset_jobs_from_result', lazy='subquery',
                                                                    cascade='delete,all', uselist=False))

    def __init__(self, data: DatasetJobData):
        super().__init__(data)
        self.dataset_id = data['datasetId']
        self.converted_dataset_id = data['resultDatasetId']

    def json(self) -> dict:
        return {
            **super().json(),
            'dataset': self.dataset.json()
        }
