"""
 OpenVINO DL Workbench
 Class to generate job.sh script content for int8 calibration

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
