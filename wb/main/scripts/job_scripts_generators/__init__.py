"""
 OpenVINO DL Workbench
 Import classes for generating job script and configuration files

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
from wb.main.scripts.job_scripts_generators.int8_calibration_job_script_generator import (
    Int8CalibrationJobScriptGenerator)
from wb.main.scripts.job_scripts_generators.profiling_configuration_generator import (
    RemoteProfilingConfigurationFileGenerator, LocalProfilingConfigurationFileGenerator,
    ProfilingConfigurationFileGenerator)
from wb.main.scripts.job_scripts_generators.profiling_job_script_generator import (get_profiling_job_script_generator,
                                                                                   LocalProfilingJobScriptGenerator,
                                                                                   RemoteProfilingJobScriptGenerator)
from wb.main.scripts.job_scripts_generators.setup_script_generator import SetupScriptGenerator
from wb.main.scripts.job_scripts_generators.dataset_annotation_job_script_generator import \
    get_dataset_annotation_job_script_generator
