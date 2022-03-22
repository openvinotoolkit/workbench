"""
 OpenVINO DL Workbench
 Class to dump manifest

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

import yaml

from wb.main.environment.manifest.manifest import Manifest


class ManifestDumper:

    @staticmethod
    def dump_to_yaml(manifest: Manifest, manifest_file_path: Path = None):
        manifest_file_path = manifest_file_path or manifest.path
        if not manifest_file_path:
            raise AssertionError('Cannot dump manifest - path is empty')
        with manifest_file_path.open('w') as manifest_file:
            yaml.safe_dump(manifest.json(), manifest_file)

    @staticmethod
    def dump_requirements(manifest: Manifest, requirements_file_path: Path):
        requirements_content = '\n'.join(str(requirement) for requirement in manifest.packages)
        with requirements_file_path.open('w') as requirements_file:
            requirements_file.writelines(requirements_content)
