"""
 OpenVINO DL Workbench
 Class for ORM model describing job for creating setup bundle

 Copyright (c) 2020 Intel Corporation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
      http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
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
