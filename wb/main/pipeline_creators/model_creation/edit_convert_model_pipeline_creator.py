"""
 OpenVINO DL Workbench
 Class for edit convert model pipeline creator

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
from wb.main.models import PipelineModel, TopologyAnalysisJobsModel, ModelOptimizerJobModel, SetupEnvironmentJobModel, \
    AnalyzeModelInputShapeJobModel
from wb.main.models.model_optimizer_job_model import ModelOptimizerJobData
from wb.main.pipeline_creators.model_creation.base_model_creation_pipeline_creator import \
    BaseModelCreationPipelineCreator


class EditConvertModelPipelineCreator(BaseModelCreationPipelineCreator):
    pipeline_type = PipelineTypeEnum.upload_model

    _model_optimizer_job: ModelOptimizerJobModel

    _job_type_to_stage_map = {
        SetupEnvironmentJobModel.get_polymorphic_job_type(): PipelineStageEnum.setup_environment,
        ModelOptimizerJobModel.get_polymorphic_job_type(): PipelineStageEnum.convert_model,
        AnalyzeModelInputShapeJobModel.get_polymorphic_job_type(): PipelineStageEnum.model_analyzer,
        TopologyAnalysisJobsModel.get_polymorphic_job_type(): PipelineStageEnum.model_analyzer,
    }

    def __init__(self, original_model_id: int, result_model_id: int):
        super().__init__()
        self.original_model_id = original_model_id
        self.result_model_id = result_model_id

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        create_environment_job = self.create_environment_setup_job(model_id=self.original_model_id,
                                                                   session=session)
        model_optimizer_job = ModelOptimizerJobModel(ModelOptimizerJobData(
            originalTopologyId=self.original_model_id,
            resultModelId=self.result_model_id,
            pipelineId=pipeline.id,
            previousJobId=create_environment_job.job_id,
            projectId=None,
            moArgs=None
        ))
        self._save_job_with_stage(model_optimizer_job, session)
        input_shape_analysis_job = self.create_model_input_shape_analysis_job(
            pipeline_id=pipeline.id,
            model_id=self.result_model_id,
            previous_job_id=model_optimizer_job.job_id
        )
        self._save_job_with_stage(input_shape_analysis_job, session)
        model_analyzer_job = self.create_model_analysis_job(pipeline_id=pipeline.id, model_id=self.result_model_id,
                                                            previous_job_id=input_shape_analysis_job.job_id)
        self._save_job_with_stage(model_analyzer_job, session)
        self._model_optimizer_job = model_optimizer_job

    @property
    def model_optimizer_job(self) -> ModelOptimizerJobModel:
        return self._model_optimizer_job
