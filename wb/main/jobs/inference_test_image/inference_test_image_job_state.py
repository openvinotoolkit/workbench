"""
 OpenVINO DL Workbench
 Infer test image job observers

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
from typing import Optional

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.job_observers import JobStateDBObserver, PipelineSocketObserver
from wb.main.jobs.interfaces.job_state import JobStateSubject, JobState
from wb.main.models.inference_test_image_job_model import InferenceTestImageJobModel
from wb.main.models.jobs_model import JobsModel
from wb.main.models.pipeline_model import PipelineModel


class InferenceTestImageJobState(JobState):
    """
    Helper class for control Inference Job state in Job subject and observers
    """

    def __init__(self, log: str = None, status: StatusEnum = None, progress: int = 0, error_message: str = None):
        super().__init__(log, status, progress, error_message)
        self.predictions: Optional[str] = None
        self.ref_predictions: Optional[str] = None


class InferenceTestImageJobStateSubject(JobStateSubject):
    def __init__(self, job_id: int):
        super().__init__(job_id)
        self._subject_state = InferenceTestImageJobState()

    def update(self, log: str = None, status: StatusEnum = None, progress: float = 0,
               error_message: str = None, predictions: str = None, ref_predictions: str = None):
        subject_state = self.subject_state
        subject_state.log = log
        subject_state.status = status
        subject_state.progress = progress
        subject_state.error_message = error_message
        subject_state.predictions = predictions
        subject_state.ref_predictions = ref_predictions
        self.subject_state = subject_state


class InferenceTestImageDBObserver(JobStateDBObserver):
    _mapper_class = InferenceTestImageJobModel

    def update(self, subject_state: InferenceTestImageJobState):
        session = get_db_session_for_celery()

        with closing(session):
            inference_job: InferenceTestImageJobModel = session.query(InferenceTestImageJobModel).get(self._job_id)

            if subject_state.predictions:
                inference_job.test_image.predictions = subject_state.predictions
            if subject_state.ref_predictions:
                inference_job.test_image.reference_predictions = subject_state.ref_predictions

            inference_job.progress = subject_state.progress
            inference_job.error_message = subject_state.error_message
            inference_job.status = subject_state.status
            inference_job.write_record(session)


class InferenceTestImageSocketObserver(PipelineSocketObserver):
    def _get_socket_payload(self) -> dict:
        session = get_db_session_for_celery()
        with closing(session):
            job = session.query(JobsModel).get(self._current_job_id)
            pipeline = session.query(PipelineModel).get(job.pipeline_id)
            return pipeline.json()
