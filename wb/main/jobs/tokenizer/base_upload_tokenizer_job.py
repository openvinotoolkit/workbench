"""
 OpenVINO DL Workbench
 Base upload tokenizer job

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
