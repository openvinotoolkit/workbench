"""
 OpenVINO DL Workbench
 Class for ORM model describing job for creating int8 calibration scripts

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
from wb.main.models.jobs_model import JobsModel, JobData
from wb.main.models.topologies_model import TopologiesModel


class SetupEnvironmentJobData(JobData):
    modelId: int


class SetupEnvironmentJobModel(JobsModel):
    __tablename__ = 'setup_environment_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.setup_environment_job.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)

    model_id = Column(Integer, ForeignKey(TopologiesModel.id), nullable=False)
    model = relationship(TopologiesModel, cascade='delete,all',
                         backref=backref('setup_environment_job',
                                         lazy='subquery', cascade='delete,all'))

    def __init__(self, data: SetupEnvironmentJobData):
        super().__init__(data)
        self.model_id = data['modelId']

    def json(self) -> dict:
        return {
            **super().json(),
            'model': self.model.json()
        }
