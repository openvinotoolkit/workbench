"""
 OpenVINO DL Workbench
 Class for ORM model for downloadable artifacts

 Copyright (c) 2018 Intel Corporation

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
import os
from typing import Tuple, Optional

from config.constants import ARTIFACTS_PATH
from wb.main.models.shared_artifact_model import SharedArtifactModel


class DownloadableArtifactsModel(SharedArtifactModel):

    __mapper_args__ = {
        'polymorphic_identity': 'downloadable_artifact'
    }

    @property
    def is_archive(self) -> bool:
        return True

    def archive_exists(self) -> Tuple[bool, Optional[str]]:
        if self.path:
            return os.path.isfile(self.path), self.path
        return False, None

    def build_full_artifact_path(self, ext: str = '.tar.gz') -> str:
        return os.path.join(ARTIFACTS_PATH, f'{self.id}{ext}')
