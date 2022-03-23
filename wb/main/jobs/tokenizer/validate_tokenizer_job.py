"""
 OpenVINO DL Workbench
 Validate tokenizer job

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
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.tokenizer.base_upload_tokenizer_job import BaseUploadTokenizerJob
from wb.main.jobs.tokenizer.upload_tokenizer_observer import UploadTokenizerDBObserver
from wb.main.models.tokenizer import ValidateTokenizerJobModel, TokenizerModel
from wb.main.utils.tokenizer.tokeinzer_wrapper import TokenizerWrapper


class ValidateTokenizerJob(BaseUploadTokenizerJob):
    job_type = JobTypesEnum.validate_tokenizer_type
    _job_model_class = ValidateTokenizerJobModel

    def run(self):
        self.job_state_subject.attach(UploadTokenizerDBObserver(job_id=self.job_id, mapper_class=self._job_model_class))
        self._attach_socket_default_observer()

        with closing(get_db_session_for_celery()) as session:
            session: Session
            job_model: ValidateTokenizerJobModel = self.get_job_model(session)

            tokenizer_model: TokenizerModel = job_model.tokenizer
            # support cancellation
            if tokenizer_model.status in (StatusEnum.cancelled, StatusEnum.error):
                return

            # validate tokenizer
            try:
                tokenizer = TokenizerWrapper.from_model(tokenizer_model)
                tokenizer.validate()
                tokenizer.save(path=tokenizer_model.path)
            except Exception as exception:
                raise Exception(f"Cannot initialize tokenizer {tokenizer_model.name} from loaded files") from exception

            tokenizer_model.vocab_size = tokenizer.vocab_size()
            tokenizer_model.write_record(session)

            self._job_state_subject.update_state(status=StatusEnum.ready)
            self._job_state_subject.detach_all_observers()
