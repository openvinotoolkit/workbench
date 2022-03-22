"""
 OpenVINO DL Workbench
 Upload tokenizer observer

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
from typing import Type, Union

from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.job_observers import JobStateDBObserver
from wb.main.jobs.interfaces.job_state import JobState
from wb.main.models import ValidateTokenizerJobModel, WaitTokenizerUploadJobsModel, PipelineModel, TokenizerModel

UploadTokenizerJobModels = Union[WaitTokenizerUploadJobsModel, ValidateTokenizerJobModel]


class UploadTokenizerDBObserver(JobStateDBObserver):
    def __init__(self, job_id: int, mapper_class: Type[UploadTokenizerJobModels]):
        super().__init__(job_id)
        self._mapper_class = mapper_class

    def update(self, subject_state: JobState):
        super().update(subject_state)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job: UploadTokenizerJobModels = self.get_job_model(session)

            pipeline: PipelineModel = job.pipeline

            tokenizer: TokenizerModel = job.tokenizer
            tokenizer.progress = pipeline.pipeline_progress
            tokenizer.status = pipeline.pipeline_status_name

            if subject_state.status == StatusEnum.error:
                tokenizer.status = subject_state.status
                tokenizer.error_message = subject_state.error_message or tokenizer.error_message
            if subject_state.status == StatusEnum.cancelled:
                tokenizer.status = subject_state.status
            if pipeline.last_pipeline_job.status == StatusEnum.ready:
                tokenizer.progress = 100
                tokenizer.status = StatusEnum.ready
                tokenizer.set_checksum()
            tokenizer.write_record(session)
