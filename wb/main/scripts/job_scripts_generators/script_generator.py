"""
 OpenVINO DL Workbench
 Base classes to generate a script file

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
import stat
from pathlib import Path
from typing_extensions import TypedDict

from jinja2 import Environment, FileSystemLoader

from config.constants import (JOBS_SCRIPTS_FOLDER, JOB_ARTIFACTS_FOLDER_NAME, JOB_ARTIFACTS_ARCHIVE_NAME,
                              JOBS_SCRIPTS_FOLDER_NAME, WORKBENCH_HIDDEN_FOLDER, PYTHON_VIRTUAL_ENVIRONMENT_DIR,
                              JOB_FINISH_MARKER)
from wb.main.enumerates import JobTypesEnum


class ScriptGenerationContext(TypedDict):
    JOB_ARTIFACT_PATH: str
    DEFAULT_ARCHIVE_ARTIFACT_NAME: str
    SCRIPTS_PATH: str
    DEPENDENCIES_PATH: str
    WORKBENCH_HIDDEN_FOLDER: str
    PYTHON_ENVIRONMENT_PATH: str
    JOB_FINISH_MARKER: str


class ScriptGenerator:
    _script_context = ScriptGenerationContext(
        JOB_ARTIFACT_PATH=JOB_ARTIFACTS_FOLDER_NAME,
        DEFAULT_ARCHIVE_ARTIFACT_NAME=JOB_ARTIFACTS_ARCHIVE_NAME,
        SCRIPTS_PATH=JOBS_SCRIPTS_FOLDER_NAME,
        DEPENDENCIES_PATH='dependencies',
        WORKBENCH_HIDDEN_FOLDER=WORKBENCH_HIDDEN_FOLDER,
        PYTHON_ENVIRONMENT_PATH=PYTHON_VIRTUAL_ENVIRONMENT_DIR,
        JOB_FINISH_MARKER=JOB_FINISH_MARKER,
    )

    _template_file_name: str

    def __init__(self):
        self._templates_path = Path(JOBS_SCRIPTS_FOLDER) / 'templates'
        self._template = self._get_jinja_environment.get_template(self._template_file_name)

    @property
    def _get_jinja_environment(self) -> Environment:
        env = Environment(loader=FileSystemLoader(self._templates_path),
                          trim_blocks=True, lstrip_blocks=True, autoescape=True)
        env.globals.update({
            'JobTypesEnum': JobTypesEnum,
        })
        return env

    def create(self, result_file_path: str):
        result_file_path = Path(result_file_path)
        content = self._template.render(**self._script_context)
        with result_file_path.open('w') as result_file:
            result_file.write(content)
        file_state = result_file_path.stat()
        result_file_path.chmod(file_state.st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
