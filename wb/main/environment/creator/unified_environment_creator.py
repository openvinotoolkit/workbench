"""
 OpenVINO DL Workbench
 Class for creating environment from existing in TF2 env

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
