"""
 OpenVINO DL Workbench
 Class for creation job for downloading log

 Copyright (c) 2018 Intel Corporation

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

import os
import shutil
from contextlib import closing

from config.constants import LOG_FILE
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.interfaces.job_observers import DownloadLogDBObserver
from wb.main.enumerates import StatusEnum, JobTypesEnum
from wb.main.models import DownloadLogJobModel, DownloadableArtifactsModel


class DownloadLogJob(IJob):
    job_type = JobTypesEnum.download_log_type
    _job_model_class = DownloadLogJobModel
    ext = '.txt'

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        download_log_db_observer = DownloadLogDBObserver(job_id=self._job_id)
        self._job_state_subject.attach(download_log_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(log='Starting Log Download job.', status=StatusEnum.running, progress=0)
        session = get_db_session_for_celery()
        with closing(session):
            job_model = self.get_job_model(session)
            artifact = job_model.shared_artifact
            artifact_path = artifact.build_full_artifact_path(ext=self.ext)
            # move log to artifacts
            if not os.path.isfile(LOG_FILE):
                self._job_state_subject.update_state(status=StatusEnum.error, error_message='Can not find log file.')
                return
            shutil.copy(LOG_FILE, artifact_path)
            artifact.update(artifact_path)
            artifact.write_record(session)

        self._job_state_subject.update_state(log='Finishing Log Download job.', status=StatusEnum.ready, progress=100)
        self._job_state_subject.detach_all_observers()

    def on_failure(self, exception: Exception):
        session = get_db_session_for_celery()
        with closing(session):
            job_model = self.get_job_model(session)
            artifact = job_model.artifact
            artifact_path = artifact.build_full_artifact_path(ext=self.ext)
        if os.path.isfile(artifact_path):
            os.remove(artifact_path)
        super().on_failure(exception)
