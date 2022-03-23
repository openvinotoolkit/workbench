"""
 OpenVINO DL Workbench
 Class for model upload pipeline creator

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

from wb.main.enumerates import PipelineTypeEnum, PipelineStageEnum, SupportedFrameworksEnum, ModelSourceEnum
from wb.main.models import (PipelineModel, TopologyAnalysisJobsModel, ModelOptimizerScanJobModel,
                            ModelOptimizerJobModel, TopologiesModel, WaitModelUploadJobModel, SetupEnvironmentJobModel,
                            AnalyzeModelInputShapeJobModel)
from wb.main.models.model_optimizer_job_model import ModelOptimizerJobData
from wb.main.models.topologies_model import ModelJobData
from wb.main.pipeline_creators.model_creation.base_model_creation_pipeline_creator import \
    BaseModelCreationPipelineCreator


class UploadOriginalModelPipelineCreator(BaseModelCreationPipelineCreator):
    pipeline_type = PipelineTypeEnum.upload_model

    _converted_model: TopologiesModel
    _model_optimizer_job_id: int

    _job_type_to_stage_map = {
        WaitModelUploadJobModel.get_polymorphic_job_type(): PipelineStageEnum.wait_model_upload,
        SetupEnvironmentJobModel.get_polymorphic_job_type(): PipelineStageEnum.setup_environment,
        ModelOptimizerScanJobModel.get_polymorphic_job_type(): PipelineStageEnum.model_optimizer_scan,
        ModelOptimizerJobModel.get_polymorphic_job_type(): PipelineStageEnum.convert_model,
        AnalyzeModelInputShapeJobModel.get_polymorphic_job_type(): PipelineStageEnum.model_analyzer,
        TopologyAnalysisJobsModel.get_polymorphic_job_type(): PipelineStageEnum.model_analyzer,
    }

    def __init__(self, model_id: int, model_name: str, metadata_id: int, framework: SupportedFrameworksEnum):
        super().__init__()
        self.model_id = model_id
        self.model_name = model_name
        self.metadata_id = metadata_id
        self.framework = framework

    def create_result_model(self, session: Session):
        uploaded_model: TopologiesModel = session.query(TopologiesModel).get(self.model_id)

        self._converted_model = TopologiesModel(self.model_name, SupportedFrameworksEnum.openvino, self.metadata_id)
        self._converted_model.domain = uploaded_model.domain
        self._converted_model.source = ModelSourceEnum.original
        self._converted_model.converted_from = self.model_id
        self._converted_model.write_record(session)

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        self.create_result_model(session)
        upload_model_job = self.create_upload_model_job(model_id=self.model_id, pipeline_id=pipeline.id)
        self._save_job_with_stage(upload_model_job, session)
        create_environment_job = self.create_environment_setup_job(model_id=self.model_id,
                                                                   previous_job_id=upload_model_job.job_id,
                                                                   session=session)
        model_optimizer_scan_job = self.create_model_optimizer_scan_job(pipeline_id=pipeline.id,
                                                                        previous_job_id=create_environment_job.job_id)
        self._save_job_with_stage(model_optimizer_scan_job, session)
        model_optimizer_job = self.create_model_optimizer_job(pipeline_id=pipeline.id,
                                                              previous_job_id=model_optimizer_scan_job.job_id)
        self._save_job_with_stage(model_optimizer_job, session)
        input_shape_analysis_job = self.create_model_input_shape_analysis_job(
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

    def create_model_optimizer_scan_job(self, pipeline_id: int,
                                        previous_job_id: int = None) -> ModelOptimizerScanJobModel:
        return ModelOptimizerScanJobModel(ModelJobData(
            modelId=self.model_id,
            pipelineId=pipeline_id,
            previousJobId=previous_job_id,
            projectId=None
        ))

    def create_model_optimizer_job(self, pipeline_id: int, previous_job_id: int = None) -> ModelOptimizerScanJobModel:
        return ModelOptimizerJobModel(ModelOptimizerJobData(
            originalTopologyId=self.model_id,
            resultModelId=self._converted_model.id,
            pipelineId=pipeline_id,
            previousJobId=previous_job_id,
            projectId=None,
            moArgs=None
        ))

    @property
    def converted_model(self) -> TopologiesModel:
        return self._converted_model

    @property
    def model_optimizer_job_id(self) -> int:
        return self._model_optimizer_job_id
