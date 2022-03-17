"""
 OpenVINO DL Workbench
 Class for ir model upload pipeline creator

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
