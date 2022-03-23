"""
 OpenVINO DL Workbench
 Upload tokenizer pipeline creator

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
from sqlalchemy.orm import Session

from wb.main.enumerates import PipelineTypeEnum, PipelineStageEnum
from wb.main.models import LocalTargetModel, PipelineModel
from wb.main.models.tokenizer.validate_tokenizer_jobs_model import ValidateTokenizerJobModel
from wb.main.models.tokenizer.wait_tokenizer_upload_jobs_model import WaitTokenizerUploadJobsModel, \
    TokenizerUploadJobData
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class UploadTokenizerPipelineCreator(PipelineCreator):
    pipeline_type = PipelineTypeEnum.upload_tokenizer

    _job_type_to_stage_map = {
        WaitTokenizerUploadJobsModel.get_polymorphic_job_type(): PipelineStageEnum.wait_tokenizer_upload,
        ValidateTokenizerJobModel.get_polymorphic_job_type(): PipelineStageEnum.validate_tokenizer,
    }

    _pipeline = [
        WaitTokenizerUploadJobsModel,
        ValidateTokenizerJobModel,
    ]

    def __init__(self, tokenizer_id: int, model_id: int):
        local_target_model = LocalTargetModel.query.one()
        super().__init__(local_target_model.id)
        self.tokenizer_id = tokenizer_id
        self.model_id = model_id

    def get_job_data(self, pipeline: PipelineModel) -> TokenizerUploadJobData:
        job_data = TokenizerUploadJobData(
            tokenizer_id=self.tokenizer_id,
            model_id=self.model_id,
            pipelineId=pipeline.id,
            previousJobId=None,
            projectId=None
        )
        return job_data

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        job_data = self.get_job_data(pipeline)

        for stage_model in self._pipeline:
            stage = stage_model(job_data)
            self._save_job_with_stage(stage, session)
            job_data['previousJobId'] = stage.job_id
