"""
 OpenVINO DL Workbench
 Classes to validate environment suitability for manifest

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
