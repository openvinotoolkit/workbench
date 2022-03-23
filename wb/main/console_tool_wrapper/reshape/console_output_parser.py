"""
 OpenVINO DL Workbench
 Class for reshape tool progress tracking

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
import re

from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.job_state import JobStateSubject
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser, skip_empty_line_decorator


class ReshapeToolParser(ConsoleToolOutputParser):
    def __init__(self, job_state_subject: JobStateSubject):
        super().__init__(job_state_subject=job_state_subject)
        self._progress_pattern = re.compile(rf'^(\[RESHAPE TOOL]:\s*(?P<progress>\d+\.?\d*)%)$')

    @skip_empty_line_decorator
    def parse(self, string: str) -> None:
        output_match = self._progress_pattern.search(string)
        if not output_match:
            return

        progress = output_match.group('progress')
        self._job_state_subject.update_state(progress=float(progress), status=StatusEnum.running)
