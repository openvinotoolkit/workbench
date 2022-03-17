"""
 OpenVINO DL Workbench
 Abstract classes to track status of environment manipulations

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
from typing import Callable


class EnvironmentState:
    _stages: Enum = None

    def __init__(self):
        self._state = {
            # pylint: disable=not-an-iterable
            stage: 0 for stage in self._stages
        }
        self._error_message = None
        self._current_stage = None

    def update_progress(self, progress):
        self._state[self._current_stage] = progress

    def set_current_stage(self, stage: Enum):
        self._current_stage = stage

    def finish_current_stage(self):
        self.update_progress(100)

    @property
    def progress(self):
        return sum(self._state.values()) / len(self._state)


class StatusReporter:
    _state_class = EnvironmentState

    def __init__(self, status_reporter: Callable = None):
        self._state = self._state_class()
        self._status_reporter = status_reporter

    def update_progress(self, progress):
        self._state.update_progress(progress)
        self.report_status()

    def report_status(self):
        if self._status_reporter:
            self._status_reporter(progress=self._state.progress)

    def error_message(self, error_message: str):
        self._status_reporter(error_message=error_message)

    def status_callback(self, progress: int = None, error_message: str = None):
        if progress:
            self.update_progress(progress)
        if error_message:
            self.error_message(error_message)
