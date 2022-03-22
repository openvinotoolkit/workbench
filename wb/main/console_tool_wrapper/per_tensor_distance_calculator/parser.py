"""
 OpenVINO DL Workbench
 Parser of output of Per tensor distance calculator

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
from wb.main.jobs.accuracy_analysis.per_tensor.per_tensor_analysis_job_state import PerTensorAnalysisJobStateSubject
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser, skip_empty_line_decorator


class PerTensorDistanceCalculatorParser(ConsoleToolOutputParser):
    _job_state_subject: PerTensorAnalysisJobStateSubject

    def __init__(self, job_state_subject: PerTensorAnalysisJobStateSubject):
        super().__init__(job_state_subject=job_state_subject)
        self.tensor_distance_calculator_output_parser = re.compile(
            rf'^(\[TENSOR DISTANCE]\s*(?P<progress>\d+)%)$'
        )

    @skip_empty_line_decorator
    def parse(self, string: str):
        output_match = self.tensor_distance_calculator_output_parser.search(string)
        if not output_match:
            return

        percentage = float(output_match.group('progress'))

        self._job_state_subject.update_state(progress=percentage, status=StatusEnum.running)
