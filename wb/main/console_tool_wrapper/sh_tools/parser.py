"""
 OpenVINO DL Workbench
 Class for parsing of outputs from standard unix tools

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
