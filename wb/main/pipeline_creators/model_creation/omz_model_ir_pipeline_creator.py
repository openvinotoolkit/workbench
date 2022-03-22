"""
 OpenVINO DL Workbench
 Class for ir OMZ model download pipeline creator

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

from wb.main.enumerates import PipelineStageEnum
from wb.main.models import PipelineModel, TopologyAnalysisJobsModel, OMZModelDownloadJobModel, OMZModelMoveJobModel, \
    AnalyzeModelInputShapeJobModel
from wb.main.pipeline_creators.model_creation.base_omz_model_pipeline_creator import BaseOMZModelPipelineCreator


class OMZModelIRPipelineCreator(BaseOMZModelPipelineCreator):
    _job_type_to_stage_map = {
        OMZModelDownloadJobModel.get_polymorphic_job_type(): PipelineStageEnum.download_omz_model,
        OMZModelMoveJobModel.get_polymorphic_job_type(): PipelineStageEnum.move_omz_model,
        AnalyzeModelInputShapeJobModel.get_polymorphic_job_type(): PipelineStageEnum.model_analyzer,
        TopologyAnalysisJobsModel.get_polymorphic_job_type(): PipelineStageEnum.model_analyzer,
    }

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        self._create_result_model(session)
        download_job_record = self.create_download_job(pipeline_id=pipeline.id)
        self._save_job_with_stage(download_job_record, session)
        move_model_job = self.create_move_model_job(pipeline_id=pipeline.id, previous_job_id=download_job_record.job_id)
        self._save_job_with_stage(move_model_job, session)
        input_shape_analysis_job = self.create_model_input_shape_analysis_job(
            pipeline_id=pipeline.id,
            model_id=self._result_model.id,
            previous_job_id=move_model_job.job_id
        )
        self._save_job_with_stage(input_shape_analysis_job, session)
        model_analysis_job = self.create_model_analysis_job(pipeline_id=pipeline.id,
                                                            model_id=self._result_model.id,
                                                            previous_job_id=input_shape_analysis_job.job_id)
        self._save_job_with_stage(model_analysis_job, session)
