"""
 OpenVINO DL Workbench
 Class for ORM model describing job for getting system resources from target

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
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel
from wb.main.models.remote_target_model import RemoteTargetModel
from wb.main.models.target_model import TargetModel


class GetSystemResourcesJobModel(JobsModel):
    __tablename__ = 'get_system_resources_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.get_system_resources_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)

    target_id = Column(Integer, ForeignKey(TargetModel.id))

    target: RemoteTargetModel = relationship('RemoteTargetModel', foreign_keys=[target_id],
                                             backref=backref('get_system_resources_job',
                                                             lazy='subquery',
                                                             cascade='delete,all'))

    def __init__(self, data: dict):
        super().__init__(data)
        self.target_id = data['targetId']

    def json(self) -> dict:
        return {
            **super().json(),
            'targetId': self.target_id,
        }
