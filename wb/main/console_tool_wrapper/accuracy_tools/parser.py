"""
 OpenVINO DL Workbench
 Parser of output of Accuracy Checker tool

 Copyright (c) 2018 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
