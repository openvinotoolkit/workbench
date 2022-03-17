"""
 OpenVINO DL Workbench
 Class for ORM model describing job for running setup on target

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
from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel
from wb.main.models.remote_target_model import RemoteTargetModel


class SetupTargetJobsModel(JobsModel):
    __tablename__ = 'setup_target_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.setup_target_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)

    target_id = Column(Integer, ForeignKey(RemoteTargetModel.id))

    setup_bundle_path = Column(String, nullable=False)

    target: RemoteTargetModel = relationship('RemoteTargetModel', foreign_keys=[target_id],
                                             backref=backref('setup_target_job',
                                                             lazy='subquery',
                                                             cascade='delete,all'))

    def __init__(self, data: dict):
        super().__init__(data)
        self.target_id = data['targetId']
        self.setup_bundle_path = data['setupBundlePath']

    def json(self) -> dict:
        return {
            **super().json(),
            'targetId': self.target_id,
            'setupBundlePath': self.setup_bundle_path,
        }
