"""
 OpenVINO DL Workbench
 Base classes to generate a job script file

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
from wb.main.scripts.job_scripts_generators.script_generator import ScriptGenerator, ScriptGenerationContext


class JobScriptGenerationContext(ScriptGenerationContext):
    job_type: str


class JobScriptGenerator(ScriptGenerator):
    _template_file_name = 'base_job.sh.jinja'
    _script_context: JobScriptGenerationContext
