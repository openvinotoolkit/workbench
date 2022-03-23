"""
 OpenVINO DL Workbench
 Class for cli output of calibration tool

 Copyright (c) 2018 Intel Corporation

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

from wb.main.enumerates import StatusEnum
from wb.main.jobs.models.model_optimizer_scan_job_state import ModelOptimizerScanJobStateSubject
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser, skip_empty_line_decorator


class ModelOptimizerScanParser(ConsoleToolOutputParser):
    _job_state_subject: ModelOptimizerScanJobStateSubject

    def __init__(self, job_state_subject: ModelOptimizerScanJobStateSubject):
        super().__init__(job_state_subject=job_state_subject)
        self.counter = 0

    @skip_empty_line_decorator
    def parse(self, string: str):
        speed = 0.75
        percent = min(speed * self.counter, 99)
        self.counter += 1
        self._job_state_subject.update_state(progress=percent, status=StatusEnum.running)
