"""
 OpenVINO DL Workbench
 Wait tokenizer upload job

 Copyright (c) 2021 Intel Corporation

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
from wb.main.jobs.tokenizer.base_upload_tokenizer_job import BaseUploadTokenizerJob
from wb.main.jobs.tokenizer.upload_tokenizer_observer import UploadTokenizerDBObserver
from wb.main.models.tokenizer import WaitTokenizerUploadJobsModel, TokenizerModel


class WaitTokenizerUploadJob(BaseUploadTokenizerJob):
    job_type = JobTypesEnum.wait_upload_tokenizer_type
    _job_model_class = WaitTokenizerUploadJobsModel

    def run(self):
        self.job_state_subject.attach(UploadTokenizerDBObserver(job_id=self.job_id, mapper_class=self._job_model_class))
        self._attach_socket_default_observer()

        with closing(get_db_session_for_celery()) as session:
            session: Session
            job_model: WaitTokenizerUploadJobsModel = self.get_job_model(session)

            tokenizer: TokenizerModel = job_model.tokenizer

            if tokenizer.status is StatusEnum.cancelled:
                return

            # handle failed artifact upload
            if tokenizer.status is StatusEnum.error:
                self.on_failure(Exception(tokenizer.error_message))
                return

            self._job_state_subject.update_state(status=StatusEnum.running, progress=tokenizer.uploaded_progress)

            if not tokenizer.is_all_files_uploaded:
                raise ManualTaskRetryException(
                    'Tokenizer artifact is not uploaded yet, retry task',
                    countdown=FILE_UPLOAD_RETRY_COUNTDOWN,
                    max_retries=FILE_UPLOAD_MAX_RETRY
                )

            self._job_state_subject.update_state(status=StatusEnum.ready)
            self._job_state_subject.detach_all_observers()
