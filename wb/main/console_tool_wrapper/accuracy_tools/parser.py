"""
 OpenVINO DL Workbench
 Parser of output of Accuracy Checker tool

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

from wb.main.enumerates import StatusEnum
from wb.main.jobs.accuracy_analysis.accuracy.accuracy_job_state import AccuracyJobStateSubject
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser, skip_empty_line_decorator
from wb.main.scripts.accuracy_tool.tool_output import AcCLIOutput


class AccuracyCheckerParser(ConsoleToolOutputParser):
    _job_state_subject: AccuracyJobStateSubject

    def __init__(self, job_state_subject: AccuracyJobStateSubject):
        super().__init__(job_state_subject=job_state_subject)
        self.accuracy_tool_output = re.compile(rf'.*(?:\[ACCURACY CHECKER]:\s*(?P<accuracy_output>.*))')

    @skip_empty_line_decorator
    def parse(self, string: str):
        output_match = self.accuracy_tool_output.search(string)
        if not output_match:
            return

        output: AcCLIOutput = AcCLIOutput.from_string(output_match.group('accuracy_output'))
        self._job_state_subject.update_state(progress=output.progress, status=StatusEnum.running)
        if output.done:
            self._job_state_subject.set_accuracy_results(output.accuracy_results)
