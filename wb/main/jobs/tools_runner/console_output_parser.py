"""
 OpenVINO DL Workbench
 Interface class for parsing outputs of console tools

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
