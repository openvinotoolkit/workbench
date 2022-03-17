"""
 OpenVINO DL Workbench
 Class for ORM model described an Datasets

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
