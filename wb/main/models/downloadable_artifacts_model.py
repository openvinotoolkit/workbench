"""
 OpenVINO DL Workbench
 Class for ORM model for downloadable artifacts

 Copyright (c) 2018 Intel Corporation

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
from typing import Tuple, Optional

from sqlalchemy import Column, Integer, ForeignKey

from config.constants import ARTIFACTS_PATH
from wb.main.models.shared_artifact_model import SharedArtifactModel


class DownloadableArtifactsModel(SharedArtifactModel):

    __mapper_args__ = {
        'polymorphic_identity': 'downloadable_artifacts'
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
