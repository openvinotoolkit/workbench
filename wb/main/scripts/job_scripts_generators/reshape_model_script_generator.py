"""
 OpenVINO DL Workbench
 Class to generate job.sh script content for reshape model job

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
import os

from config.constants import JOBS_SCRIPTS_FOLDER_NAME, JOBS_SCRIPTS_FOLDER, RESHAPE_MODEL_CONFIG_FILE_NAME
from wb.main.enumerates import JobTypesEnum
from wb.main.scripts.job_scripts_generators.job_script_generator import JobScriptGenerator, JobScriptGenerationContext


class ReshapeModelScriptContext(JobScriptGenerationContext):
    RESHAPE_MODEL_SCRIPT_PATH_IN_BUNDLE: str
    CONFIG_PATH_IN_RESHAPE_MODEL_BUNDLE: str


class ReshapeModelScriptGenerator(JobScriptGenerator):
    wrapper_script_filename = 'reshape.py'

    _script_context = ReshapeModelScriptContext(
        **JobScriptGenerator._script_context,
        job_type=JobTypesEnum.reshape_model.value,
        RESHAPE_MODEL_SCRIPT_PATH_IN_BUNDLE=os.path.join(JOBS_SCRIPTS_FOLDER, wrapper_script_filename),
        CONFIG_PATH_IN_RESHAPE_MODEL_BUNDLE=os.path.join(
            JOBS_SCRIPTS_FOLDER_NAME,
            RESHAPE_MODEL_CONFIG_FILE_NAME
        ),
    )
