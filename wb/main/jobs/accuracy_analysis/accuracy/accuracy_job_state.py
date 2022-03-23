"""
 OpenVINO DL Workbench
 Classes for accuracy job state handling

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
from contextlib import closing
from typing import List, Optional

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.job_observers import JobStateDBObserver, check_existing_job_model_decorator, \
    PipelineSocketObserver
from wb.main.jobs.interfaces.job_state import JobStateSubject, JobState
from wb.main.models import AccuracyJobsModel, PipelineModel
from wb.main.scripts.accuracy_tool.tool_output import AccuracyResult
from wb.main.utils.observer_pattern import notify_decorator


class AccuracyJobState(JobState):
    """
    Helper class for control Accuracy Job state in Job subject and observers
    """

    def __init__(self, status: StatusEnum = None, progress: int = None, error_message: str = None,
                 warning_message: str = None):
        super().__init__(log=None, status=status, progress=progress, error_message=error_message,
                         warning_message=warning_message)
        self.accuracy_results: Optional[List[AccuracyResult]] = None


class AccuracyJobStateSubject(JobStateSubject):

    def update_state(self, log: str = None, status: StatusEnum = None,
                     progress: float = None, error_message: str = None,
                     warning_message: str = None):
        if status == StatusEnum.ready:
            progress = 100
        self.subject_state = AccuracyJobState(status=status, progress=progress, error_message=error_message,
                                              warning_message=warning_message)

    @notify_decorator
    def set_accuracy_results(self, value: List[AccuracyResult]):
        self.subject_state.accuracy_results = value


class AccuracyDBObserver(JobStateDBObserver):
    _mapper_class = AccuracyJobsModel

    @check_existing_job_model_decorator
    def update(self, subject_state: AccuracyJobState):
        with closing(get_db_session_for_celery()) as session:
            accuracy_job: AccuracyJobsModel = self.get_job_model(session)
            accuracy_job.progress = subject_state.progress or accuracy_job.progress
            accuracy_job.status = subject_state.status or accuracy_job.status
            accuracy_job.error_message = subject_state.error_message or accuracy_job.error_message
            accuracy_job.write_record(session)


class AccuracyPipelineSocketObserver(PipelineSocketObserver):
    def _get_socket_payload(self) -> dict:
        with closing(get_db_session_for_celery()) as session:
            accuracy_job: AccuracyJobsModel = self.get_job_model(session)
            pipeline: PipelineModel = accuracy_job.pipeline
            return pipeline.json()
