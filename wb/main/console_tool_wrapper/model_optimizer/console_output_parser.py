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

import re

from wb.main.jobs.models.model_optimizer_job_state import ModelOptimizerJobStateSubject
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser


class ModelOptimizerParser(ConsoleToolOutputParser):
    def __init__(self, job_state_subject: ModelOptimizerJobStateSubject):
        super().__init__(job_state_subject=job_state_subject)
        self._progress_pattern = re.compile(r'.*Progress: \[.*]\s*(?P<progress>\d+(.\d+)?)%\sdone$')

    def parse(self, string: str):
        progress_match = self._progress_pattern.search(string)
        if progress_match:
            percent = float(progress_match.group('progress'))
            self._job_state_subject.update_state(progress=percent)
