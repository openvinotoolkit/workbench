"""
 OpenVINO DL Workbench
 Class for saving data to database from reshape model pipeline

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
from contextlib import closing

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.jobs.interfaces.job_observers import JobStateDBObserver, check_existing_job_model_decorator
from wb.main.jobs.interfaces.job_state import JobState
from wb.main.models import ReshapeModelJobModel


class ReshapeModelDBObserver(JobStateDBObserver):
    _mapper_class = ReshapeModelJobModel

    @check_existing_job_model_decorator
    def update(self, subject_state: JobState):
        session = get_db_session_for_celery()
        with closing(session):
            job_model: ReshapeModelJobModel = self.get_job_model(session)
            job_model.progress = subject_state.progress or job_model.progress
            job_model.status = subject_state.status or job_model.status
            job_model.error_message = subject_state.error_message or job_model.error_message
            job_model.write_record(session)

            shape_configuration = job_model.shape_model_configuration
            shape_configuration.status = job_model.status
            shape_configuration.write_record(session)
