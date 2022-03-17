"""
 OpenVINO DL Workbench
 Class for ORM model describes bundles for cloud service

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
import os.path
from pathlib import Path

from sqlalchemy import event

from config.constants import CLOUD_SHARED_FOLDER, FULL_ACCESS_FOLDER_PERMISSION, SETUP_BUNDLE_SUBFOLDER
from wb.main.enumerates import StatusEnum, ArtifactTypesEnum
from wb.main.models.shared_artifact_model import SharedArtifactModel
from wb.main.utils.utils import set_permission


class CloudBundleModel(SharedArtifactModel):

    __mapper_args__ = {
        'polymorphic_identity': 'cloud_bundle'
    }

    @property
    def is_archive(self) -> bool:
        return False

    def build_full_artifact_path(self, *args) -> str:
        if self.artifact_type == ArtifactTypesEnum.deployment_package:
            return os.path.join(CLOUD_SHARED_FOLDER, SETUP_BUNDLE_SUBFOLDER)
        return os.path.join(CLOUD_SHARED_FOLDER, str(self.job.pipeline_id))

    @property
    def bundle_exists(self) -> bool:
        return self.path and Path(self.path).exists()


@event.listens_for(CloudBundleModel, 'after_update', propagate=True)
def set_permission_for_cloud_bundle(unused_mapper, unused_connection, bundle: CloudBundleModel):
    if bundle.status != StatusEnum.ready or not bundle.path:
        return
    set_permission(bundle.path, FULL_ACCESS_FOLDER_PERMISSION)
