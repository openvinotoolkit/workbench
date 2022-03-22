"""
 OpenVINO DL Workbench
 Base abstractions for environment validation

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

from wb.main.environment.manifest import Manifest
from wb.main.models.environment_model import EnvironmentModel


class EnvironmentValidator:
    """Base abstract class for environment validators"""

    def __init__(self, manifest: Manifest):
        super().__init__()
        self._manifest = manifest

    def validate(self, environment: EnvironmentModel) -> bool:
        raise NotImplementedError(f'Validation method is not implemented in {self.__class__}')
