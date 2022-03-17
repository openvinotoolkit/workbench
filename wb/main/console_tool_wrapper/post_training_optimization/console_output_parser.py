"""
 OpenVINO DL Workbench
 Class for post training optimization tool's progress tracking

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
