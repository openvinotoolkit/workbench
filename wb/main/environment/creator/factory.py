"""
 OpenVINO DL Workbench
 Factory class to create an instance of environment creator

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
from typing import Callable, Optional

from config.constants import SERVER_MODE
from wb.main.environment.creator.creator import EnvironmentCreator
from wb.main.environment.creator.manifest_specific_environment_creator import ManifestSpecificEnvironmentCreator
from wb.main.environment.creator.unified_environment_creator import UnifiedEnvironmentCreator
from wb.main.environment.manifest import Manifest


class EnvironmentCreatorFactory:
    """Base abstract class for creating environment"""

    @staticmethod
    def create(manifest: Manifest,
               status_callback: Callable[[Optional[float], Optional[str]], None]) -> EnvironmentCreator:
        if SERVER_MODE == 'development':
            return UnifiedEnvironmentCreator(manifest, status_callback)
        return ManifestSpecificEnvironmentCreator(manifest, status_callback)
