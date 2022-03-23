"""
 OpenVINO DL Workbench
 Abstraction for manifest of model

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
from pathlib import Path
from typing import List

from pkg_resources import Requirement


class Manifest:
    def __init__(self, requirements: List[Requirement], model_name: str = None, manifest_path: Path = None):
        self.model_name = model_name
        self._requirements = requirements
        self._path = manifest_path

    @property
    def packages(self) -> List[Requirement]:
        return self._requirements

    @property
    def path(self) -> Path:
        return Path(self._path)

    @path.setter
    def path(self, path: Path):
        self._path = path

    def json(self) -> dict:
        data = {
            'requirements': [str(package) for package in self.packages]
        }
        if self.model_name:
            data['modelName'] = self.model_name
        return data
