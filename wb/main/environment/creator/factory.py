"""
 OpenVINO DL Workbench
 Factory class to create an instance of environment creator

 Copyright (c) 2021 Intel Corporation

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
