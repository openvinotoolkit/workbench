"""
 OpenVINO DL Workbench
 Class for per tensor report pipeline socket observer

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

from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.jobs.interfaces.job_observers import PipelineSocketObserver
from wb.main.models import JobsModel


class PerTensorReportPipelineSocketObserver(PipelineSocketObserver):
    def _get_socket_payload(self) -> dict:
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job: JobsModel = session.query(JobsModel).get(self._current_job_id)
            return job.pipeline.json()
