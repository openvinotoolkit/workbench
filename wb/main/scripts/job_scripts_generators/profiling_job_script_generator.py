"""
 OpenVINO DL Workbench
 Classes to generate script file for profiling

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
