"""
 OpenVINO DL Workbench
 Class for creating ORM for local per tensor report pipeline model and dependent models

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

from wb.main.enumerates import PipelineTypeEnum, PipelineStageEnum, TargetTypeEnum, AccuracyReportTypeEnum
from wb.main.models import TargetModel, ProjectsModel, PerTensorReportJobsModel, CreatePerTensorScriptsJobModel
from wb.main.models.accuracy_model import AccuracyJobData
from wb.main.models.jobs_model import JobData
from wb.main.models.pipeline_model import PipelineModel
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class LocalPerTensorReportPipelineCreator(PipelineCreator):
    pipeline_type = PipelineTypeEnum.local_per_tensor_report

    _job_type_to_stage_map = {
        CreatePerTensorScriptsJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_accuracy_assets,
        PerTensorReportJobsModel.get_polymorphic_job_type(): PipelineStageEnum.accuracy,
    }

    def __init__(self, project_id: int):
        local_target_model = TargetModel.query.filter_by(target_type=TargetTypeEnum.local).first()
        super().__init__(local_target_model.id)
        self.project_id = project_id

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        project: ProjectsModel = ProjectsModel.query.get(self.project_id)
        target_dataset_id = project.dataset_id
        create_per_tensor_scripts_job_data = JobData(
            projectId=self.project_id,
            pipelineId=pipeline.id,
            previousJobId=None
        )
        create_per_tensor_scripts_job_model = CreatePerTensorScriptsJobModel(create_per_tensor_scripts_job_data)
        self._save_job_with_stage(create_per_tensor_scripts_job_model, session)

        per_tensor_report_job_data = AccuracyJobData(targetDatasetId=target_dataset_id,
                                                     reportType=AccuracyReportTypeEnum.parent_model_per_tensor,
                                                     projectId=self.project_id,
                                                     pipelineId=pipeline.id,
                                                     previousJobId=create_per_tensor_scripts_job_model.job_id)
        per_tensor_report_job_model = PerTensorReportJobsModel(per_tensor_report_job_data)
        self._save_job_with_stage(per_tensor_report_job_model, session)
