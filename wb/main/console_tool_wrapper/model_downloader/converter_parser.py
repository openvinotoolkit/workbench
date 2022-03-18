"""
 OpenVINO DL Workbench
 Class for parsing output of convert.py of Model Downloader

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

from wb.error.job_error import ModelOptimizerError
from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.job_state import JobStateSubject
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser


class OMZTopologyConvertParser(ConsoleToolOutputParser):
    def __init__(self, job_state_subject: JobStateSubject):
        super().__init__(job_state_subject=job_state_subject)
        self.counter = 0

    def parse(self, string: str):
        if '[ ERROR ]' in string:
            self._job_state_subject.update_state(error_message=string, status=StatusEnum.error)
            raise ModelOptimizerError(string, 1)
        percent = min(0.075 * self.counter, 99)  # Until Model Optimizer provides progress bar.
        self._job_state_subject.update_state(progress=percent)
        self.counter += 1
