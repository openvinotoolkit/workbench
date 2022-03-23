"""
 OpenVINO DL Workbench
 Per tensor analysis job state

 Copyright (c) 2021 Intel Corporation

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
