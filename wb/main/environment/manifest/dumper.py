"""
 OpenVINO DL Workbench
 Class to dump manifest

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
