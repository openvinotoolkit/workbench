"""
 OpenVINO DL Workbench
 Class for ORM model described a Environment

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
from typing import List, Dict

from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import Session

from config.constants import ENVIRONMENTS_FOLDER
from wb.main.models.base_model import BaseModel


class EnvironmentModel(BaseModel):
    __tablename__ = 'environments'

    id = Column(Integer, primary_key=True, autoincrement=True)

    path = Column(String, nullable=True)
    manifest_path = Column(String, nullable=True)

    is_ready = Column(Boolean, nullable=False, default=False)

    dependencies: List['DependencyModel']

    def __init__(self, manifest_path: Path = None, path: Path = None):
        self.manifest_path = str(manifest_path) if manifest_path else None
        self.path = str(path)

    def json(self) -> dict:
        return {
            'isReady': self.is_ready,
            'path': self.path,
            'manifest': self.manifest_path
        }

    @property
    def python_executable(self) -> Path:
        return Path(self.path, 'bin', 'python')

    @property
    def installed_packages(self) -> Dict:
        return {dependency.package.lower(): dependency.version for dependency in self.dependencies}

    def build_environment_path(self) -> Path:
        return Path(ENVIRONMENTS_FOLDER) / str(self.id)

    def mark_as_not_ready(self, session: Session):
        self.is_ready = False
        self.write_record(session)
