"""
 OpenVINO DL Workbench
 Classes to generate setup script file

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
from config.constants import NO_SUDO_SETUP_MESSAGE
from wb.main.scripts.job_scripts_generators.script_generator import ScriptGenerator, ScriptGenerationContext


class SetupScriptGenerationContext(ScriptGenerationContext):
    NO_SUDO_SETUP_MESSAGE: str


class SetupScriptGenerator(ScriptGenerator):
    _script_context = SetupScriptGenerationContext(
        **ScriptGenerator._script_context,
        NO_SUDO_SETUP_MESSAGE=NO_SUDO_SETUP_MESSAGE,
    )

    def __init__(self, template_name: str):
        self._template_file_name = f'{template_name}.jinja'
        super().__init__()
