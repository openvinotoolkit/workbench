"""
 OpenVINO DL Workbench
 Classes for creating environment job state handling

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


class SetupEnvironmentJobState(JobState):
    """
    Helper class for control Extract Dataset Job state in Job subject and observers
    """

    def __init__(self, log: str = None, status: StatusEnum = None, progress: int = None,
                 error_message: str = None, warning_message: str = None, environment_id: int = None):
        super().__init__(log=log, status=status, progress=progress, error_message=error_message,
                         warning_message=warning_message)
        self.environment_id = environment_id


class SetupEnvironmentJobStateSubject(JobStateSubject):

    def update_state(self, log: str = None, status: StatusEnum = None, progress: float = None,
                     error_message: str = None, warning_message: str = None):
        if status == StatusEnum.ready:
            progress = 100
        self.subject_state = SetupEnvironmentJobState(log=log, status=status, progress=progress,
                                                      error_message=error_message,
                                                      warning_message=warning_message)

    def finish_environment_setup(self, environment_id: int):
        self.subject_state = SetupEnvironmentJobState(environment_id=environment_id,
                                                      status=StatusEnum.ready,
                                                      progress=100)
