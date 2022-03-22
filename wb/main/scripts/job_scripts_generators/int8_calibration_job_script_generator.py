"""
 OpenVINO DL Workbench
 Class to generate job.sh script content for int8 calibration

 Copyright (c) 2020 Intel Corporation

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

from config.constants import INT8_CALIBRATION_CONFIGURATION_FILE_NAME, JOBS_SCRIPTS_FOLDER_NAME
from wb.main.enumerates import JobTypesEnum
from wb.main.scripts.job_scripts_generators.job_script_generator import JobScriptGenerator, JobScriptGenerationContext


class Int8CalibrationJobScriptGenerationContext(JobScriptGenerationContext):
    CONFIG_PATH_IN_INT8CALIBRATION_BUNDLE: str


class Int8CalibrationJobScriptGenerator(JobScriptGenerator):
    _script_context = Int8CalibrationJobScriptGenerationContext(
        **JobScriptGenerator._script_context,
        job_type=JobTypesEnum.int8calibration_type.value,
        CONFIG_PATH_IN_INT8CALIBRATION_BUNDLE=os.path.join(
            JOBS_SCRIPTS_FOLDER_NAME,
            INT8_CALIBRATION_CONFIGURATION_FILE_NAME),
    )
