"""
 OpenVINO DL Workbench
 Wait tokenizer upload job

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
