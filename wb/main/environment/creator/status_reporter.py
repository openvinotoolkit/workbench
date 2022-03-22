"""
 OpenVINO DL Workbench
 Classes to track status of creating environment

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
from enum import Enum

from wb.main.environment.status_reporter.status_reporter import StatusReporter, EnvironmentState


class CreateEnvironmentStagesEnum(Enum):
    create_environment = 'create_environment'
    install_packages = 'install_packages'


class CreateEnvironmentState(EnvironmentState):
    _stages = CreateEnvironmentStagesEnum


class CreateEnvironmentStatusReporter(StatusReporter):
    _state_class = CreateEnvironmentState

    def start_creation(self):
        self._state.set_current_stage(stage=CreateEnvironmentStagesEnum.create_environment)
        self.report_status()

    def start_installation(self):
        self._state.finish_current_stage()
        self._state.set_current_stage(stage=CreateEnvironmentStagesEnum.install_packages)
        self.report_status()
