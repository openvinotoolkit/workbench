"""
 OpenVINO DL Workbench
 Class for creating environment from existing in TF2 env

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

from sqlalchemy.orm import Session

from config.constants import TF2_PYTHON
from wb.main.environment.creator import EnvironmentCreator
from wb.main.environment.manifest import ManifestFactory, ManifestDumper, Manifest
from wb.main.models import EnvironmentModel


class UnifiedEnvironmentCreator(EnvironmentCreator):
    """Class for creating environment from existing in TF2 env"""

    def _create(self, session: Session, unused_is_prc: bool) -> EnvironmentModel:
        self._status_report_callback(progress=0)
        environment = EnvironmentModel(path=Path(TF2_PYTHON).parent.parent)
        environment.write_record(session=session)
        self._status_report_callback(progress=40)
        manifest = self._create_manifest(environment=environment)
        self._status_report_callback(progress=60)
        environment.manifest_path = str(manifest.path)
        environment.write_record(session=session)
        self._status_report_callback(progress=100)
        return environment

    def _create_manifest(self, environment: EnvironmentModel) -> Manifest:
        requirements = self._collect_installed_packages(environment)
        manifest = ManifestFactory.create_from_requirements(requirements)
        manifest.path = Path(environment.path) / 'manifest.yml'
        ManifestDumper.dump_to_yaml(manifest)
        return manifest
