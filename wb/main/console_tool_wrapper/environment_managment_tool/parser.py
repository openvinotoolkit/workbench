"""
 OpenVINO DL Workbench
 Classes to parse output from tool for package installing

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
import re
from typing import List, Callable

from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser, skip_empty_line_decorator


class InstallPackagesToolState:
    def __init__(self, packages: List[str]):
        self._packages_state = {package: False for package in packages}

    def mark_as_installed(self, package):
        if package in self._packages_state:
            self._packages_state[package] = True

    @property
    def progress(self) -> float:
        installed = len([package_state for package_state in self._packages_state.values() if package_state])
        full = len(self._packages_state)
        return installed / full * 100


class InstallPackagesToolParser(ConsoleToolOutputParser):

    def __init__(self, packages: List[str], progress_reporter: Callable[[float], None]):
        super().__init__()
        self._state = InstallPackagesToolState(packages)
        self._progress_reporter = progress_reporter
        self._package_version_pattern = r'\d+(?:\.\d+)*'
        self._package_pattern = rf'(?P<package>\w+(-\w+)?s?)'
        self._successfully_installed_package_pattern = (
            re.compile(rf'(?:Collecting\s{self._package_pattern}.+{self._package_version_pattern})')
        )

    @skip_empty_line_decorator
    def parse(self, string: str):
        successfully_installed_match = self._successfully_installed_package_pattern.search(string)
        if successfully_installed_match:
            all_packages = successfully_installed_match.group('package')
            filtered_packages = filter(bool,
                                       re.split(rf'-{self._package_version_pattern}\s?',
                                                all_packages)
                                       )
            packages = list(filtered_packages)
            self.update_installed_packages(packages)

    def update_installed_packages(self, packages):
        for package in packages:
            self._state.mark_as_installed(package)
        self._progress_reporter(self._state.progress)
