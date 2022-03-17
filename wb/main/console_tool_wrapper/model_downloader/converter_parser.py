"""
 OpenVINO DL Workbench
 Class for parsing output of convert.py of Model Downloader

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

from wb.error.job_error import ModelOptimizerError
from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.job_state import JobStateSubject
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser


class OMZTopologyConvertParser(ConsoleToolOutputParser):
    def __init__(self, job_state_subject: JobStateSubject):
        super().__init__(job_state_subject=job_state_subject)
        self.counter = 0

    def parse(self, string: str):
        if '[ ERROR ]' in string:
            self._job_state_subject.update_state(error_message=string, status=StatusEnum.error)
            raise ModelOptimizerError(string, 1)
        percent = min(0.075 * self.counter, 99)  # Until Model Optimizer provides progress bar.
        self._job_state_subject.update_state(progress=percent)
        self.counter += 1
