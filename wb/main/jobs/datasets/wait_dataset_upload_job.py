"""
 OpenVINO DL Workbench
 Class for waiting dataset upload job for dataset creation

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
