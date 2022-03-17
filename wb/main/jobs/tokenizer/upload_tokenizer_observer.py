"""
 OpenVINO DL Workbench
 Upload tokenizer observer

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
