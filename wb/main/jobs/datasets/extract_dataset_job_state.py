"""
 OpenVINO DL Workbench
 Classes for extract dataset job state handling

 Copyright (c) 2020 Intel Corporation

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
from wb.main.utils.observer_pattern import notify_decorator


class ExtractDatasetJobState(JobState):
    """
    Helper class for control Extract Dataset Job state in Job subject and observers
    """

    # pylint: disable=too-many-arguments
    def __init__(self, log: str = None, status: StatusEnum = None, progress: int = None, error_message: str = None,
                 warning_message: str = None, dataset_size: float = None, dataset_path: str = None):
        super().__init__(log=log, status=status, progress=progress, error_message=error_message,
                         warning_message=warning_message)
        self.dataset_size = dataset_size
        self.dataset_path = dataset_path


class ExtractDatasetJobStateSubject(JobStateSubject):

    def update_state(self, log: str = None, status: StatusEnum = None,
                     progress: float = None, error_message: str = None,
                     warning_message: str = None):
        if status == StatusEnum.ready:
            progress = 100
        self.subject_state = ExtractDatasetJobState(log=log, status=status, progress=progress,
                                                    error_message=error_message,
                                                    warning_message=warning_message)

    @notify_decorator
    def set_path(self, path: str):
        self.subject_state.dataset_path = path

    @notify_decorator
    def set_size(self, size: float):
        self.subject_state.dataset_size = size
