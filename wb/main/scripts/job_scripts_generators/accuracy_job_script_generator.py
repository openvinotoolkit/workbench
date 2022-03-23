"""
 OpenVINO DL Workbench
 Class to generate job.sh script content for accuracy

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

from config.constants import (ACCURACY_CONFIGURATION_FILE_NAME, CHECK_ACCURACY_SCRIPT_PATH,
                              JOBS_SCRIPTS_FOLDER, JOBS_SCRIPTS_FOLDER_NAME)
from wb.main.enumerates import TargetTypeEnum, JobTypesEnum
from wb.main.models import AccuracyJobsModel, TargetModel
from wb.main.scripts.job_scripts_generators.job_script_generator import JobScriptGenerator, JobScriptGenerationContext


class AccuracyJobScriptGenerationContext(JobScriptGenerationContext):
    CONFIG_PATH_IN_ACCURACY_BUNDLE: str
    ACCURACY_WRAPPER_PATH_IN_BUNDLE: str
    PROFILE_FLAGS: str
    LOG_DIR: str


class AccuracyJobScriptGenerator(JobScriptGenerator):
    _profile_flags = f'--profile'

    _script_context = AccuracyJobScriptGenerationContext(
        **JobScriptGenerator._script_context,
        job_type=JobTypesEnum.accuracy_type.value,
        CONFIG_PATH_IN_ACCURACY_BUNDLE=os.path.join(
            JOBS_SCRIPTS_FOLDER_NAME,
            ACCURACY_CONFIGURATION_FILE_NAME
        ),
    )

    def __init__(self, profile: bool):
        super().__init__()
        self._script_context['PROFILE_FLAGS'] = self._profile_flags if profile else ''


class RemoteAccuracyJobScriptGenerator(AccuracyJobScriptGenerator):
    _script_context = AccuracyJobScriptGenerationContext(
        **AccuracyJobScriptGenerator._script_context,
        ACCURACY_WRAPPER_PATH_IN_BUNDLE=
        f'$JOB_BUNDLE_PATH/{os.path.join(JOBS_SCRIPTS_FOLDER_NAME, CHECK_ACCURACY_SCRIPT_PATH)}',
    )


class LocalAccuracyJobScriptGenerator(AccuracyJobScriptGenerator):
    _script_context = AccuracyJobScriptGenerationContext(
        **AccuracyJobScriptGenerator._script_context,
        ACCURACY_WRAPPER_PATH_IN_BUNDLE=os.path.join(
            JOBS_SCRIPTS_FOLDER,
            CHECK_ACCURACY_SCRIPT_PATH
        ),
    )


def get_accuracy_job_script_generator(accuracy_job: AccuracyJobsModel,
                                      profile: bool) -> AccuracyJobScriptGenerator:
    target: TargetModel = accuracy_job.project.target
    if target.target_type == TargetTypeEnum.local:
        return LocalAccuracyJobScriptGenerator(profile)
    return RemoteAccuracyJobScriptGenerator(profile)
