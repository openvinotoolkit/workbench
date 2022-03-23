"""
 OpenVINO DL Workbench
 Base classes to generate a job script file

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
from wb.main.scripts.job_scripts_generators.script_generator import ScriptGenerator, ScriptGenerationContext


class JobScriptGenerationContext(ScriptGenerationContext):
    job_type: str


class JobScriptGenerator(ScriptGenerator):
    _template_file_name = 'base_job.sh.jinja'
    _script_context: JobScriptGenerationContext
