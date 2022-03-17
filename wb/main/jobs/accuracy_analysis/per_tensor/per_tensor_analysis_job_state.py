"""
 OpenVINO DL Workbench
 Per tensor analysis job state

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

from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.job_state import JobStateSubject, JobState


class PerTensorAnalysisJobState(JobState):
    """
    Helper class for control Per Tensor Analysis Job state in Job subject and observers
    """

    def __init__(self, log: str = None, status: StatusEnum = None, progress: int = None, error_message: str = None,
                 warning_message: str = None):
        super().__init__(log=log, status=status, progress=progress, error_message=error_message,
                         warning_message=warning_message)


class PerTensorAnalysisJobStateSubject(JobStateSubject):
    def __init__(self, job_id: int):
        super().__init__(job_id)
        self._subject_state = PerTensorAnalysisJobState()

    def update(self, log: str = None, status: StatusEnum = None, progress: float = 0, error_message: str = None):
        subject_state = self.subject_state
        subject_state.log = log
        subject_state.status = status
        subject_state.progress = progress
        subject_state.error_message = error_message
        self.subject_state = subject_state
