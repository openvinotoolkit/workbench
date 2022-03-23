"""
 OpenVINO DL Workbench
 Classes to generate setup script file

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
