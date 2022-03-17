"""
 OpenVINO DL Workbench
 Class to generate job.sh script content for reshape model job

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
