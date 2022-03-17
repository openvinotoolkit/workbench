"""
 OpenVINO DL Workbench
 ImportHuggingfaceJobModel

 Copyright (c) 2022 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""

from sqlalchemy import Integer, Column, ForeignKey, String
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel
from wb.main.models.topologies_model import TopologiesModel, ModelJobData


class ImportHuggingfaceJobData(ModelJobData):
    huggingface_model_id: str


class ImportHuggingfaceJobModel(JobsModel):
    __tablename__ = 'import_huggingface_model_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.import_huggingface_model_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    model_id = Column(Integer, ForeignKey(TopologiesModel.id), nullable=False)
    huggingface_model_id = Column(String, nullable=False)

    model: TopologiesModel = relationship(TopologiesModel, foreign_keys=[model_id],
                                          backref=backref('import_huggingface_model_job', lazy='subquery',
                                                          cascade='delete,all', uselist=False))

    def __init__(self, data: ImportHuggingfaceJobData):
        super().__init__(data)
        self.model_id = data['modelId']
        self.huggingface_model_id = data['huggingface_model_id']
