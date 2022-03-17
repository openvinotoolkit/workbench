"""
 OpenVINO DL Workbench
 Classes to track status of creating environment

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
