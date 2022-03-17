"""
 OpenVINO DL Workbench
 Class to create instance of EnvironmentValidator

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
from wb.main.environment.validators.manifest_specific_validator import ManifestEnvironmentValidator
from wb.main.environment.validators.validator import EnvironmentValidator


class EnvironmentValidatorFactory:
    """ Class to create instance of EnvironmentValidator """

    @staticmethod
    def create(manifest: Manifest) -> EnvironmentValidator:
        return ManifestEnvironmentValidator(manifest)
