"""
 OpenVINO DL Workbench
 Class for reshape tool progress tracking

 Copyright (c) 2021 Intel Corporation

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
