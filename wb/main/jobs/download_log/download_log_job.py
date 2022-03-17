"""
 OpenVINO DL Workbench
 Class for creation job for downloading log

 Copyright (c) 2018 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
            artifact = job_model.downloadable_artifact
            artifact_path = DownloadableArtifactsModel.get_archive_path(artifact_id=artifact.id, ext=self.ext)
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
            artifact = job_model.downloadable_artifact
            artifact_path = DownloadableArtifactsModel.get_archive_path(artifact_id=artifact.id, ext=self.ext)
        if os.path.isfile(artifact_path):
            os.remove(artifact_path)
        super().on_failure(exception)
