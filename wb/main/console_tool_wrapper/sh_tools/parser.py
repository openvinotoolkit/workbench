"""
 OpenVINO DL Workbench
 Class for parsing of outputs from standard unix tools

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
import re

from wb.main.jobs.interfaces.job_state import JobStateSubject
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser


class ShParser(ConsoleToolOutputParser):
    def __init__(self, job_state_subject: JobStateSubject):
        super().__init__()
        self._job_state_subject = job_state_subject

    def parse(self, string: str):
        self._job_state_subject.update_state(log=string)


class ExtractParser(ConsoleToolOutputParser):
    progress = 0

    # Annotations
    _job_state_subject: JobStateSubject

    def __init__(self, job_state_subject: JobStateSubject):
        super().__init__()
        self._job_state_subject = job_state_subject

    def parse(self, string: str):
        stage = r'inflating:'
        if re.search(stage, string):
            if self.progress < 99:
                self.progress += 3
            if self.progress % 3 * 5:
                message = 'Extracting: {:.2f}'.format(self.progress)
                self._job_state_subject.update_state(log=message)
