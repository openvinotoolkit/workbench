"""
 OpenVINO DL Workbench
 Classes for model optimizer job state handling

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
from wb.main.jobs.interfaces.job_state import JobStateSubject, JobState
from wb.main.enumerates import StatusEnum
from wb.main.utils.observer_pattern import notify_decorator
from wb.main.utils.utils import create_empty_dir


class ModelOptimizerJobState(JobState):
    """
    Helper class for control Model Optimizer Job state in Job subject and observers
    """

    # pylint: disable=too-many-arguments
    def __init__(self, log: str = None, status: StatusEnum = None, progress: int = None, error_message: str = None,
                 warning_message: str = None, model_path: str = None, mo_args: str = None,
                 detailed_error_message: str = None):
        super().__init__(log=log, status=status, progress=progress, error_message=error_message,
                         warning_message=warning_message)
        self.model_path = model_path
        self.mo_args = mo_args
        self.detailed_error_message = detailed_error_message


class ModelOptimizerJobStateSubject(JobStateSubject):

    def update_state(self, log: str = None, status: StatusEnum = None,
                     progress: float = None, error_message: str = None,
                     warning_message: str = None):
        if status == StatusEnum.ready:
            progress = 100
        self.subject_state = ModelOptimizerJobState(log=log, status=status, progress=progress,
                                                    error_message=error_message,
                                                    warning_message=warning_message)

    @notify_decorator
    def set_model_path(self, path: str):
        self.subject_state.model_path = path
        create_empty_dir(path)

    @notify_decorator
    def set_mo_args(self, mo_args: str):
        self.subject_state.mo_args = mo_args

    @notify_decorator
    def set_detailed_error_message(self, error: str):
        self.subject_state.detailed_error_message = error
