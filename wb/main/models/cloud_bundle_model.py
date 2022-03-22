"""
 OpenVINO DL Workbench
 Class for ORM model describes bundles for cloud service

 Copyright (c) 2022 Intel Corporation

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
