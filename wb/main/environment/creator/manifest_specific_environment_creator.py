"""
 OpenVINO DL Workbench
 Class for creating environment by manifest

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
import shutil
import tempfile
from pathlib import Path
from typing import Callable, Optional

from sqlalchemy.orm import Session

from config.constants import PYPI_MIRROR_FOR_PRC, OPENVINO_DEV_WHEEL, OPENVINO_RUNTIME_WHEEL
from wb.main.console_tool_wrapper.environment_managment_tool import CreateVirtualEnvTool, InstallPackagesTool, \
    InstallPackagesToolParser
from wb.main.environment.creator import EnvironmentCreator
from wb.main.environment.creator.status_reporter import CreateEnvironmentStatusReporter
from wb.main.environment.manifest import ManifestDumper, Manifest
from wb.main.jobs.tools_runner.local_runner import LocalRunner
from wb.main.models.environment_model import EnvironmentModel


class ManifestSpecificEnvironmentCreator(EnvironmentCreator):
    """Class for creating environment by manifest"""

    def __init__(self, manifest: Manifest, status_report_callback: Callable[[Optional[float], Optional[str]], None]):
        super().__init__(manifest, status_report_callback)
        self._status_reporter = CreateEnvironmentStatusReporter(status_report_callback)

    def _create(self, session: Session, is_prc: bool) -> EnvironmentModel:
        environment = self._create_environment_model(session)
        environment_path = Path(environment.path)
        self._create_python_virtual_environment(environment_path)
        self.install_packages(environment.python_executable, is_prc)
        return environment

    def _create_environment_model(self, session: Session) -> EnvironmentModel:
        environment = EnvironmentModel(manifest_path=self._manifest.path)
        environment.write_record(session=session)
        environment.path = str(environment.build_environment_path())
        environment.write_record(session=session)
        return environment

    def _create_python_virtual_environment(self, virtualenv_path: Path):
        self._status_reporter.start_creation()
        shutil.rmtree(virtualenv_path, ignore_errors=True)
        create_environment_tool = CreateVirtualEnvTool(virtualenv_path)
        runner = LocalRunner(tool=create_environment_tool)
        return_code, _ = runner.run_console_tool()
        if return_code:
            raise RuntimeError(f'Cannot create a python virtual environment in {virtualenv_path}')

    def install_packages(self, python_executable: Path, is_prc: bool):
        with tempfile.TemporaryDirectory('rw') as tmp_requirements_folder:
            self._status_reporter.start_installation()
            requirements_file_path = Path(tmp_requirements_folder) / 'requirements.txt'
            ManifestDumper.dump_requirements(self._manifest, requirements_file_path)
            parser = InstallPackagesToolParser([package.name for package in self._manifest.packages],
                                               self._status_reporter.update_progress)
            pip_tool = InstallPackagesTool(python_exec=python_executable,
                                           requirement_file=requirements_file_path,
                                           mirror=PYPI_MIRROR_FOR_PRC if is_prc else None,
                                           runtime_wheel=OPENVINO_RUNTIME_WHEEL,
                                           dev_wheel=OPENVINO_DEV_WHEEL)
            runner = LocalRunner(tool=pip_tool, parser=parser)
            return_code, _ = runner.run_console_tool()
            if return_code:
                raise RuntimeError(f'Cannot install packages for python {python_executable}')
