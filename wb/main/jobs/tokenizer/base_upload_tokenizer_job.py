"""
 OpenVINO DL Workbench
 Base upload tokenizer job

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
from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.models.tokenizer import TokenizerModel


class BaseUploadTokenizerJob(IJob):

    def run(self):
        raise NotImplementedError

    def _get_tokenizer(self, session: Session) -> TokenizerModel:
        job_model = self.get_job_model(session)
        return job_model.tokenizer

    def on_failure(self, exception: Exception):
        super().on_failure(exception)
        with closing(get_db_session_for_celery()) as session:
            tokenizer = self._get_tokenizer(session)
            if not tokenizer:
                return

            tokenizer.status = StatusEnum.error
            tokenizer.error_message = str(exception)
            tokenizer.write_record(session=session)

    def terminate(self):
        super().terminate()
        with closing(get_db_session_for_celery()) as session:
            tokenizer = self._get_tokenizer(session)

            if not tokenizer:
                return

            for file in tokenizer.files:
                file.status = StatusEnum.cancelled
                file.write_record(session=session)

            tokenizer.status = StatusEnum.cancelled
            tokenizer.write_record(session=session)
            tokenizer.remove_files()

    def set_task_id(self, task_id: str):
        with closing(get_db_session_for_celery()) as session:
            super().set_task_id(task_id=task_id)
            tokenizer = self._get_tokenizer(session)
            if not tokenizer:
                return
            tokenizer.task_id = task_id
            tokenizer.write_record(session=session)
