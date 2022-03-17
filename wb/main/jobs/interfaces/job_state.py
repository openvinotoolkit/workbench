"""
 OpenVINO DL Workbench
 Classes describing job state and implementing subject

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
from typing import Optional

from wb.main.enumerates import StatusEnum
from wb.main.utils.observer_pattern import Subject


class JobState:
    """
    Helper class for working with Job state in Job subject and observers
    """

    def __init__(self, log: str = None, status: StatusEnum = None, progress: int = None, error_message: str = None,
                 warning_message: str = None):
        self.log = log
        self.status = status
        self.progress = progress
        self.error_message = error_message
        self.warning_message = warning_message


class JobStateSubject(Subject):
    # Annotations
    subject_state: JobState

    def __init__(self, job_id: int):
        super().__init__()
        self._job_id = job_id

    def update_state(self, log: str = None, status: StatusEnum = None, progress: float = None,
                     error_message: str = None, warning_message: str = None):
        if status == StatusEnum.ready:
            progress = 100
        self.subject_state = JobState(log=log, status=status, progress=progress, error_message=error_message,
                                      warning_message=warning_message)

    @property
    def job_id(self) -> int:
        return self._job_id

    @property
    def job_progress(self) -> Optional[int]:
        return self.subject_state.progress

    @property
    def job_status(self) -> Optional[StatusEnum]:
        return self.subject_state.status
