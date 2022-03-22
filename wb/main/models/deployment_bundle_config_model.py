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
import os

from sqlalchemy import Column, Integer, ForeignKey, Boolean, String
from sqlalchemy.ext.hybrid import hybrid_method
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql.elements import and_

from config.constants import ARTIFACTS_PATH
from wb.main.enumerates import DeploymentTargetEnum, TargetOSEnum
from wb.main.models.base_model import BaseModel
from wb.main.models.enumerates import DEPLOYMENT_TARGET_ENUM_SCHEMA, TARGET_OS_ENUM_SCHEMA


# pylint: disable=too-many-instance-attributes
class DeploymentBundleConfigModel(BaseModel):
    __tablename__ = 'deployment_bundle_configs'

    include_model = Column(Boolean, nullable=False)
    model_name = Column(String, nullable=True)

    id = Column(Integer, primary_key=True, autoincrement=True)
    setup_script = Column(Boolean, default=False)
    get_devices_script = Column(Boolean, default=False)
    get_resources_script = Column(Boolean, default=False)
    edge_node_setup_script = Column(Boolean, default=False)

    operating_system = Column(TARGET_OS_ENUM_SCHEMA, nullable=False,
                              default=TargetOSEnum.ubuntu18)

    deployment_bundle_id = Column(Integer, ForeignKey('shared_artifacts.id'),
                                  nullable=False)

    # Relationships
    targets = relationship('DeploymentTargetsModel', lazy='subquery', cascade='all,delete-orphan', uselist=True)
    deployment_bundle = relationship('SharedArtifactModel',
                                     foreign_keys=[deployment_bundle_id],
                                     cascade='delete,all', uselist=False,
                                     backref=backref('deployment_bundle_config',
                                                     lazy='subquery', cascade='delete,all', uselist=False))
    setup_bundle_job: 'CreateSetupBundleJobModel'

    def __init__(self, data: dict, deployment_bundle_id: int):
        self.include_model = data['includeModel']
        self.model_name = data.get('modelName')
        self.setup_script = data['setupScript']
        self.get_devices_script = data['getDevicesScript']
        self.get_resources_script = data['getResourcesScript']
        self.edge_node_setup_script = data['edgeNodeSetupScript']
        self.operating_system = TargetOSEnum(data['operatingSystem'])
        self.deployment_bundle_id = deployment_bundle_id

    def json(self) -> dict:
        return {
            'deploymentBundleId': self.deployment_bundle_id,
            'includeModel': self.include_model,
            'modelName': self.model_name,
            'setupScript': self.setup_script,
            'getDevicesScript': self.get_devices_script,
            'getResourcesScript': self.get_resources_script,
            'edgeNodeSetupScript': self.edge_node_setup_script,
            'targets': self.targets_to_json,
            'operatingSystem': self.operating_system.value,
        }

    @property
    def absolute_package_path(self) -> str:
        return os.path.join(ARTIFACTS_PATH, self.package_name)

    @property
    def targets_to_json(self) -> list:
        return [target.target.value for target in self.targets]

    @hybrid_method
    def is_equal_to_config(self, config: dict) -> bool:
        return (
                config['includeModel'] == self.include_model and
                config['setupScript'] == self.setup_script and
                config['operatingSystem'] == self.operating_system
        )

    @is_equal_to_config.expression
    def is_equal_to_config(cls, config: dict) -> bool:
        return and_(
            config['includeModel'] == cls.include_model,
            config['setupScript'] == cls.setup_script,
            config['operatingSystem'] == cls.operating_system
        )

    def target_equals(self, targets: list) -> bool:
        return set(self.targets_to_json) == set(targets)


class DeploymentTargetsModel(BaseModel):
    __tablename__ = 'deployment_targets'

    id = Column(Integer, primary_key=True)
    deployment_bundle_config_id = Column(Integer, ForeignKey(DeploymentBundleConfigModel.id), nullable=False)
    target = Column(DEPLOYMENT_TARGET_ENUM_SCHEMA, nullable=False)

    def __init__(self, deployment_bundle_config: DeploymentBundleConfigModel, target: DeploymentTargetEnum):
        self.deployment_bundle_config_id = deployment_bundle_config.id
        self.target = target
