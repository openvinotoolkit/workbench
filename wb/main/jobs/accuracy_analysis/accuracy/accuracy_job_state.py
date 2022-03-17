"""
 OpenVINO DL Workbench
 Classes for accuracy job state handling

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
