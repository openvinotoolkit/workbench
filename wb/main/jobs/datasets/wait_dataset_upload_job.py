"""
 OpenVINO DL Workbench
 Class for waiting dataset upload job for dataset creation

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

from sqlalchemy.orm import Session

from config.constants import FILE_UPLOAD_RETRY_COUNTDOWN, FILE_UPLOAD_MAX_RETRY
from wb.error.job_error import ManualTaskRetryException
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.datasets.base_dataset_job import BaseDatasetJob
from wb.main.models import DatasetsModel
from wb.main.models.wait_dataset_upload_jobs_model import WaitDatasetUploadJobsModel


class WaitDatasetUploadJob(BaseDatasetJob):
    job_type = JobTypesEnum.wait_upload_dataset_type
    _job_model_class = WaitDatasetUploadJobsModel

    def run(self):
        self._job_state_subject.update_state(log='Starting uploading dataset job', status=StatusEnum.running)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            upload_dataset_job: WaitDatasetUploadJobsModel = self.get_job_model(session)
            dataset: DatasetsModel = upload_dataset_job.dataset
            if dataset.status in (StatusEnum.cancelled, StatusEnum.error):
                return
            self._job_state_subject.update_state(status=StatusEnum.running, progress=dataset.uploaded_progress)
            if not dataset.is_all_files_uploaded:
                raise ManualTaskRetryException('Dataset artifact is not uploaded yet, retry task',
                                               countdown=FILE_UPLOAD_RETRY_COUNTDOWN,
                                               max_retries=FILE_UPLOAD_MAX_RETRY)
            self._job_state_subject.update_state(status=StatusEnum.ready,
                                                 log='Dataset uploading successfully finished')
            self._job_state_subject.detach_all_observers()
