"""
 OpenVINO DL Workbench
 Classes to validate environment suitability for manifest

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
from typing import Dict

import pkg_resources

from wb.main.environment.validators.validator import EnvironmentValidator
from wb.main.models import EnvironmentModel


class ManifestEnvironmentValidator(EnvironmentValidator):
    """Class to validate environment by manifest"""

    def validate(self, environment: EnvironmentModel) -> bool:
        installed_packages = environment.installed_packages
        expected_packages = self._manifest.packages

        return all(
            self._is_package_installed(expected_package=expected_package, installed_packages=installed_packages)
            for expected_package in expected_packages
        )

    @staticmethod
    def _is_package_installed(expected_package: pkg_resources.Requirement,
                              installed_packages: Dict[str, str]) -> bool:
        expected_package_name = expected_package.name
        try:
            installed_version = installed_packages[expected_package_name.lower()]
        except KeyError:
            return False
        expected_specifier = expected_package.specifier
        return expected_specifier.contains(installed_version)
