"""
 OpenVINO DL Workbench
 Abstraction to collect requirements

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
import re
from pathlib import Path
from typing import List, Dict

import pkginfo
from pkg_resources import Requirement, parse_requirements

from config.constants import OPENVINO_DEV_WHEEL, EXTRA_REQUIREMENTS_DIRECTORY_PATH
from wb.main.enumerates import SupportedFrameworksEnum


class RequirementsCollector:

    @staticmethod
    def get_packages_from_list(requirements: List[str]) -> List[Requirement]:
        return list(map(Requirement.parse, requirements))

    @staticmethod
    def _get_stronger_requirement(first_requirement: Requirement, second_requirement: Requirement) -> Requirement:
        if second_requirement.marker and second_requirement.marker.evaluate():
            return second_requirement
        if first_requirement.marker and first_requirement.marker.evaluate():
            return first_requirement
        return second_requirement if second_requirement.specs and not first_requirement.specs else first_requirement

    @staticmethod
    def _merge_requirements(requirements: List[Requirement]) -> List[Requirement]:
        merged_requirements = {}
        for requirement in requirements:

            package_name = requirement.project_name

            if package_name not in merged_requirements:
                merged_requirements[package_name] = requirement
                continue

            merged_requirements[package_name] = RequirementsCollector._get_stronger_requirement(
                merged_requirements[package_name],
                requirement
            )
        return list(merged_requirements.values())

    @staticmethod
    def _parse_requirements(requirements: List[str]) -> List[Requirement]:
        requirements = list(map(RequirementsCollector._parse_requirement, requirements))
        requirements = parse_requirements(requirements)
        return RequirementsCollector._merge_requirements(requirements)

    @staticmethod
    def _parse_requirement(requirement: str) -> str:
        # Remove everything after the ";" symbol from f.ex. "torch (==1.8.1) ; extra == 'caffe2'"
        # as only the package name & version are needed
        if ';' in requirement:
            position = requirement.find(';')
            return requirement[:position].strip()
        else:
            return requirement

    @staticmethod
    def get_extra_requirements() -> Dict[str, List[Requirement]]:
        huggingface_onnx_file_path = EXTRA_REQUIREMENTS_DIRECTORY_PATH / 'requirements_huggingface_onnx.txt'
        parse = RequirementsCollector._parse_requirements

        return {
            'huggingface_onnx': parse(huggingface_onnx_file_path.read_text().splitlines()),
        }


class FrameworkRequirementsCollector(RequirementsCollector):

    def __init__(self, framework: SupportedFrameworksEnum):
        self._framework = framework

    @property
    def requirements(self) -> List[Requirement]:
        requirements_file = self._get_requirements(self._framework)
        return self._parse_requirements(requirements_file)

    @staticmethod
    def _get_requirements_from_wheel(framework: SupportedFrameworksEnum) -> List[str]:
        all_requirements = pkginfo.get_metadata(OPENVINO_DEV_WHEEL).requires_dist
        # Requirement example "torch (==1.8.1) ; extra == 'caffe2'"
        framework_regexp = r'extra\s*==\s*[\'\"]{}[\'\"]'

        if framework.value == 'tf':
            framework_regexp = framework_regexp.format('tensorflow')
        elif framework.value == 'tf2':
            framework_regexp = framework_regexp.format('tensorflow2')
        else:
            framework_regexp = framework_regexp.format(framework.value)
        return [requirement for requirement in all_requirements
                if re.search(framework_regexp, requirement)]

    def _get_caffe_requirements(self) -> List[Path]:
        return self._get_requirements_from_wheel(SupportedFrameworksEnum.caffe)

    def _get_caffe2_requirements(self) -> List[Path]:
        return self._get_requirements_from_wheel(SupportedFrameworksEnum.caffe2)

    def _get_mxnet_requirements(self) -> List[Path]:
        return self._get_requirements_from_wheel(SupportedFrameworksEnum.mxnet)

    def _get_tf2_requirements(self) -> List[Path]:
        return self._get_requirements_from_wheel(SupportedFrameworksEnum.tf2)

    def _get_onnx_requirements(self) -> List[Path]:
        return self._get_requirements_from_wheel(SupportedFrameworksEnum.onnx)

    def _get_torch_requirements(self) -> List[Path]:
        torch_requirements = self._get_onnx_requirements()
        torch_requirements.extend(self._get_requirements_from_wheel(SupportedFrameworksEnum.pytorch))
        return torch_requirements

    def _get_requirements(self, framework: SupportedFrameworksEnum) -> List[Path]:
        framework_requirements = {
            SupportedFrameworksEnum.caffe: self._get_caffe_requirements,
            SupportedFrameworksEnum.caffe2: self._get_caffe2_requirements,
            SupportedFrameworksEnum.mxnet: self._get_mxnet_requirements,
            SupportedFrameworksEnum.onnx: self._get_onnx_requirements,
            SupportedFrameworksEnum.tf: self._get_tf2_requirements,
            SupportedFrameworksEnum.tf2: self._get_tf2_requirements,
            SupportedFrameworksEnum.tf2_keras: self._get_tf2_requirements,
            SupportedFrameworksEnum.pytorch: self._get_torch_requirements,
        }
        return framework_requirements[framework]()
