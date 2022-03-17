"""
 OpenVINO DL Workbench
 Class for ORM model describing job for creating setup bundle

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
from wb.main.models.deployment_bundle_config_model import DeploymentBundleConfigModel
from wb.main.models.jobs_model import JobsModel


class CreateSetupBundleJobModel(JobsModel):
    __tablename__ = 'create_setup_bundle_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.create_setup_bundle_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    tab_id = Column(String, nullable=True)

    deployment_bundle_config_id = Column(Integer, ForeignKey(DeploymentBundleConfigModel.id), nullable=False)

    deployment_bundle_config: DeploymentBundleConfigModel = relationship(DeploymentBundleConfigModel,
                                                                         foreign_keys=[deployment_bundle_config_id],
                                                                         backref=backref('setup_bundle_job',
                                                                                         uselist=False,
                                                                                         lazy='subquery',
                                                                                         cascade='delete,all'))

    def __init__(self, data: dict):
        super().__init__(data)
        self.tab_id = data.get('tabId')
        self.deployment_bundle_config_id = data['deploymentBundleConfigId']

    def json(self) -> dict:
        return {
            **super().json(),
            'deploymentBundleConfigId': self.deployment_bundle_config_id,
            'tabId': self.tab_id,
            'artifactId': self.deployment_bundle_config.deployment_bundle_id,
            **self.deployment_bundle_config.json(),
        }
