"""
 OpenVINO DL Workbench
 Class for post training optimization tool's progress tracking

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

from wb.error.job_error import Int8CalibrationError
from wb.main.jobs.interfaces.job_state import JobStateSubject
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser, skip_empty_line_decorator


class PostTrainingOptimizationParser(ConsoleToolOutputParser):
    def __init__(self, job_state_subject: JobStateSubject):
        super().__init__(job_state_subject=job_state_subject)
        self.progress = re.compile(r'(?:(?P<percent>\d+(\.\d+)?)%\|.*\|[\d:]+)')
        threshold_error_message = '^.*AccuracyAwareQuantization could not achieve the required accuracy drop.*'
        self.threshold_error = re.compile(r'.*'.join(threshold_error_message.split()))

    @skip_empty_line_decorator
    def parse(self, string: str):
        self.check_error(string)
        match = self.progress.search(string)
        if match:
            progress = float(match.group('percent'))
            self._job_state_subject.update_state(progress=progress)

    def check_error(self, string: str):
        if self.threshold_error.search(string):
            message = 'Post-Training Optimization Toolkit could not achieve the required accuracy drop'
            self._job_state_subject.update_state(error_message=message)
            raise Int8CalibrationError(message, self._job_state_subject.job_id)
