"""
 OpenVINO DL Workbench
 Class for cli output of calibration tool

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
