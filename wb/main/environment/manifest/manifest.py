"""
 OpenVINO DL Workbench
 Abstraction for manifest of model

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
