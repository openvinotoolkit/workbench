"""
 OpenVINO DL Workbench
 Interface class for parsing outputs of console tools

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
from typing import Callable

from wb.main.jobs.interfaces.job_state import JobStateSubject


class ConsoleToolOutputParser:
    def __init__(self, stage_types: tuple = (),
                 job_state_subject: JobStateSubject = None):
        self._job_state_subject = job_state_subject
        self.stage_types = stage_types
        self.stdout = ''

    def parse(self, string: str):
        raise NotImplementedError


def skip_empty_line_decorator(parser: Callable) -> Callable:
    def skip_empty_line(self: ConsoleToolOutputParser, string: str):
        if not string:
            return
        parser(self, string)
    return skip_empty_line
