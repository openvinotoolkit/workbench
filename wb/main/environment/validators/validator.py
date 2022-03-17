"""
 OpenVINO DL Workbench
 Base abstractions for environment validation

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

from wb.main.environment.manifest import Manifest
from wb.main.models.environment_model import EnvironmentModel


class EnvironmentValidator:
    """Base abstract class for environment validators"""

    def __init__(self, manifest: Manifest):
        super().__init__()
        self._manifest = manifest

    def validate(self, environment: EnvironmentModel) -> bool:
        raise NotImplementedError(f'Validation method is not implemented in {self.__class__}')
