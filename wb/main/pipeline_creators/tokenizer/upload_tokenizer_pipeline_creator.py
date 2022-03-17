"""
 OpenVINO DL Workbench
 Upload tokenizer pipeline creator

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
