"""
 OpenVINO DL Workbench
 Classes to generate script file for profiling

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
from config.constants import (JOBS_SCRIPTS_FOLDER_NAME, PROFILING_JOB_WRAPPER_NAME, PROFILING_CONFIGURATION_FILE_NAME,
                              JOBS_SCRIPTS_FOLDER)
from wb.main.enumerates import TargetTypeEnum, JobTypesEnum
from wb.main.models import ProfilingJobModel, TargetModel
from wb.main.scripts.job_scripts_generators.job_script_generator import JobScriptGenerator, JobScriptGenerationContext


class ProfilingJobScriptGenerationContext(JobScriptGenerationContext):
    PROFILING_CONFIG_PATH_IN_PROFILING_BUNDLE: str
    PROFILING_PYTHON_PATH_IN_PROFILING_BUNDLE: str


class ProfilingJobScriptGenerator(JobScriptGenerator):
    _script_context = ProfilingJobScriptGenerationContext(
        **JobScriptGenerator._script_context,
        job_type=JobTypesEnum.profiling_type.value,
        PROFILING_CONFIG_PATH_IN_PROFILING_BUNDLE=os.path.join(
            JOBS_SCRIPTS_FOLDER_NAME,
            PROFILING_CONFIGURATION_FILE_NAME
        ),
    )


class RemoteProfilingJobScriptGenerator(ProfilingJobScriptGenerator):
    _script_context = ProfilingJobScriptGenerationContext(
        **ProfilingJobScriptGenerator._script_context,
        PROFILING_PYTHON_PATH_IN_PROFILING_BUNDLE=
        f'$JOB_BUNDLE_PATH/{os.path.join(JOBS_SCRIPTS_FOLDER_NAME, PROFILING_JOB_WRAPPER_NAME)}',
    )


class LocalProfilingJobScriptGenerator(ProfilingJobScriptGenerator):
    _script_context = ProfilingJobScriptGenerationContext(
        **ProfilingJobScriptGenerator._script_context,
        PROFILING_PYTHON_PATH_IN_PROFILING_BUNDLE=os.path.join(
            JOBS_SCRIPTS_FOLDER,
            PROFILING_JOB_WRAPPER_NAME
        ),
    )


def get_profiling_job_script_generator(profiling_job: ProfilingJobModel) -> ProfilingJobScriptGenerator:
    target: TargetModel = profiling_job.project.target
    if target.target_type in (TargetTypeEnum.remote, TargetTypeEnum.dev_cloud):
        return RemoteProfilingJobScriptGenerator()
    return LocalProfilingJobScriptGenerator()
