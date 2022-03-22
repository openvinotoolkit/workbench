"""
 OpenVINO DL Workbench
 Class for ir model upload pipeline creator

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
from wb.main.models import PipelineModel, TopologyAnalysisJobsModel, AnalyzeModelInputShapeJobModel
from wb.main.models.wait_model_upload_job_model import WaitModelUploadJobModel
from wb.main.pipeline_creators.model_creation.base_model_creation_pipeline_creator import \
    BaseModelCreationPipelineCreator


class UploadIRModelPipelineCreator(BaseModelCreationPipelineCreator):
    pipeline_type = PipelineTypeEnum.upload_model

    _job_type_to_stage_map = {
        WaitModelUploadJobModel.get_polymorphic_job_type(): PipelineStageEnum.wait_model_upload,
        AnalyzeModelInputShapeJobModel.get_polymorphic_job_type(): PipelineStageEnum.model_analyzer,
        TopologyAnalysisJobsModel.get_polymorphic_job_type(): PipelineStageEnum.model_analyzer,
    }

    def __init__(self, model_id: int):
        super().__init__()
        self.model_id = model_id

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        upload_model_job = self.create_upload_model_job(model_id=self.model_id, pipeline_id=pipeline.id)
        self._save_job_with_stage(upload_model_job, session)
        input_shape_analysis_job = self.create_model_input_shape_analysis_job(
            pipeline_id=pipeline.id,
            model_id=self.model_id,
            previous_job_id=upload_model_job.job_id
        )
        self._save_job_with_stage(input_shape_analysis_job, session)
        model_analyzer_job = self.create_model_analysis_job(pipeline_id=pipeline.id, model_id=self.model_id,
                                                            previous_job_id=input_shape_analysis_job.job_id)
        self._save_job_with_stage(model_analyzer_job, session)
