"""
 OpenVINO DL Workbench
 Base classes to generate a script file

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

    _template_file_name = None

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
