"""
 OpenVINO DL Workbench
 Abstraction for creating model manifest

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

import yaml

from wb.main.enumerates import SupportedFrameworksEnum
from wb.main.environment.manifest.manifest import Manifest
from wb.main.environment.manifest.requirements import FrameworkRequirementsCollector, RequirementsCollector
from wb.main.models import TopologiesModel


class ManifestFactory:
    @staticmethod
    def create_from_requirements(requirements: List[Requirement]) -> Manifest:
        return Manifest(requirements=requirements)

    @staticmethod
    def create_unified_manifest() -> Manifest:
        requirements = set()
        for framework in SupportedFrameworksEnum:
            if framework == SupportedFrameworksEnum.openvino:
                continue
            requirements.update(FrameworkRequirementsCollector(framework).requirements)
        return Manifest(requirements=list(requirements))

    @staticmethod
    def create_framework_specific(framework: SupportedFrameworksEnum, model_name: str = None,
                                  manifest_path: Path = None) -> Manifest:
        requirements = FrameworkRequirementsCollector(framework).requirements
        return Manifest(requirements=requirements, model_name=model_name, manifest_path=manifest_path)

    @staticmethod
    def create_topology_specific(topology: TopologiesModel) -> Manifest:
        name = topology.name
        manifest_path = Path(topology.path) / 'manifest.yml'
        return ManifestFactory.create_framework_specific(framework=topology.original_framework, model_name=name,
                                                         manifest_path=manifest_path)

    @staticmethod
    def load_from_file(manifest_path: Path) -> Manifest:
        with manifest_path.open() as manifest_file:
            manifest_content = yaml.safe_load(manifest_file)
        name = manifest_content.get('name')
        requirements = RequirementsCollector.get_packages_from_list(manifest_content['requirements'])
        return Manifest(model_name=name, requirements=requirements, manifest_path=manifest_path)
