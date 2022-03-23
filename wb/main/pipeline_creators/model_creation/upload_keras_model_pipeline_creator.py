"""
 OpenVINO DL Workbench
 Class for keras model upload pipeline creator

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
from wb.main.models import PipelineModel, TopologyAnalysisJobsModel, ModelOptimizerScanJobModel, \
    ModelOptimizerJobModel, ConvertKerasJobModel, SetupEnvironmentJobModel, AnalyzeModelInputShapeJobModel
from wb.main.models.topologies_model import ModelJobData
from wb.main.models.wait_model_upload_job_model import WaitModelUploadJobModel
from wb.main.pipeline_creators.model_creation.upload_original_model_pipeline_creator import \
    UploadOriginalModelPipelineCreator


class UploadKerasModelPipelineCreator(UploadOriginalModelPipelineCreator):
    _job_type_to_stage_map = {
        WaitModelUploadJobModel.get_polymorphic_job_type(): PipelineStageEnum.wait_model_upload,
        SetupEnvironmentJobModel.get_polymorphic_job_type(): PipelineStageEnum.setup_environment,
        ConvertKerasJobModel.get_polymorphic_job_type(): PipelineStageEnum.convert_keras_model,
        ModelOptimizerScanJobModel.get_polymorphic_job_type(): PipelineStageEnum.model_optimizer_scan,
        ModelOptimizerJobModel.get_polymorphic_job_type(): PipelineStageEnum.convert_model,
        AnalyzeModelInputShapeJobModel.get_polymorphic_job_type(): PipelineStageEnum.model_analyzer,
        TopologyAnalysisJobsModel.get_polymorphic_job_type(): PipelineStageEnum.model_analyzer,
    }

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        self.create_result_model(session)
        upload_model_job = self.create_upload_model_job(model_id=self.model_id, pipeline_id=pipeline.id)
        self._save_job_with_stage(upload_model_job, session)

        create_environment_job = self.create_environment_setup_job(model_id=self.model_id,
                                                                   previous_job_id=upload_model_job.job_id,
                                                                   session=session)

        convert_keras_job = self.create_convert_keras_job(pipeline_id=pipeline.id,
                                                          previous_job_id=create_environment_job.job_id)
        self._save_job_with_stage(convert_keras_job, session)
        model_optimizer_scan_job = self.create_model_optimizer_scan_job(pipeline_id=pipeline.id,
                                                                        previous_job_id=convert_keras_job.job_id)
        self._save_job_with_stage(model_optimizer_scan_job, session)
        model_optimizer_job = self.create_model_optimizer_job(pipeline_id=pipeline.id,
                                                              previous_job_id=model_optimizer_scan_job.job_id)
        self._save_job_with_stage(model_optimizer_job, session)
        input_shape_analysis_job= self.create_model_input_shape_analysis_job(
            pipeline_id=pipeline.id,
            model_id=self._converted_model.id,
            previous_job_id=model_optimizer_job.job_id
        )
        self._save_job_with_stage(input_shape_analysis_job, session)
        model_analyzer_job = self.create_model_analysis_job(pipeline_id=pipeline.id,
                                                            model_id=self._converted_model.id,
                                                            previous_job_id=input_shape_analysis_job.job_id)
        self._save_job_with_stage(model_analyzer_job, session)
        self._model_optimizer_job_id = model_optimizer_job.job_id

    def create_convert_keras_job(self, pipeline_id: int, previous_job_id: int = None) -> ConvertKerasJobModel:
        return ConvertKerasJobModel(ModelJobData(
            modelId=self.model_id,
            pipelineId=pipeline_id,
            previousJobId=previous_job_id,
            projectId=None
        ))
