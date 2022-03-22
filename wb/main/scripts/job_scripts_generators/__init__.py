"""
 OpenVINO DL Workbench
 Import classes for generating job script and configuration files

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
