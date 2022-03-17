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

from sqlalchemy import Integer, Column, ForeignKey, Text
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel
from wb.main.models.topologies_model import ModelJobData, TopologiesModel


class OMZModelConvertJobModel(JobsModel):
    __tablename__ = 'omz_model_convert_jobs'
    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.omz_model_convert_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    result_model_id = Column(Integer, ForeignKey(TopologiesModel.id), nullable=True)
    conversion_args = Column(Text, nullable=True)

    model = relationship(TopologiesModel, foreign_keys=[result_model_id],
                                backref=backref('model_downloader_converter_job',
                                                lazy='subquery', cascade='delete,all'))

    def __init__(self, data: ModelJobData):
        super().__init__(data)
        self.result_model_id = data['modelId']

    def json(self):
        return {
            'path': self.path,
            'args': self.conversion_args
        }

    @property
    def path(self) -> str:
        return self.model.path
