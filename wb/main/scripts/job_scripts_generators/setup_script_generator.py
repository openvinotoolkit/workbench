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
from wb.main.enumerates import PipelineTypeEnum
from wb.main.scripts.job_scripts_generators.script_generator import ScriptGenerator, ScriptGenerationContext


class SetupScriptGenerationContext(ScriptGenerationContext):
    NO_SUDO_SETUP_MESSAGE: str
    TELEMETRY_SPECIFIC: str
    disable_telemetry: bool


class SetupScriptGenerator(ScriptGenerator):
    _script_context = SetupScriptGenerationContext(
        **ScriptGenerator._script_context,
        NO_SUDO_SETUP_MESSAGE=NO_SUDO_SETUP_MESSAGE,
        disable_telemetry=False,
    )

    def __init__(self, template_name: str):
        self._template_file_name = f'{template_name}.jinja'
        super().__init__()


class DevCloudSetupScriptGenerator(SetupScriptGenerator):
    _script_context = SetupScriptGenerationContext(
        **ScriptGenerator._script_context,
        NO_SUDO_SETUP_MESSAGE=NO_SUDO_SETUP_MESSAGE,
        disable_telemetry=True,
    )


def get_setup_script_generator(pipeline_type: PipelineTypeEnum, template_name: str) -> SetupScriptGenerator:
    dev_cloud_pipeline_types = (
        PipelineTypeEnum.dev_cloud_profiling, PipelineTypeEnum.dev_cloud_int8_calibration,
        PipelineTypeEnum.dev_cloud_accuracy, PipelineTypeEnum.dev_cloud_per_tensor_report,
        PipelineTypeEnum.dev_cloud_predictions_relative_accuracy_report,
    )
    if pipeline_type in dev_cloud_pipeline_types:
        return DevCloudSetupScriptGenerator(template_name)
    return SetupScriptGenerator(template_name)
