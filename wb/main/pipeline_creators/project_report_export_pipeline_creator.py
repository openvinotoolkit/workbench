"""
 OpenVINO DL Workbench
 Class for creating pipeline for model report export task

 Copyright (c) 2020 Intel Corporation

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

from wb.main.models import LocalTargetModel
from wb.main.models.downloadable_artifacts_model import DownloadableArtifactsModel
from wb.main.models.enumerates import PipelineTypeEnum, PipelineStageEnum, ArtifactTypesEnum
from wb.main.models.project_report_export_job_model import ProjectReportExportJobModel
from wb.main.models.pipeline_model import PipelineModel
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class ProjectReportExportPipelineCreator(PipelineCreator):
    pipeline_type = PipelineTypeEnum.export_project_report

    _job_type_to_stage_map = {
        ProjectReportExportJobModel.get_polymorphic_job_type(): PipelineStageEnum.export_project_report,
    }

    def __init__(self, tab_id: int, project_id: int):
        local_target_model = LocalTargetModel.query.one()
        super().__init__(local_target_model.id)
        self.tab_id = tab_id
        self.project_id = project_id

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        export_report_job = ProjectReportExportJobModel({
            'projectId': self.project_id,
            'tabId': self.tab_id,
            'pipelineId': pipeline.id,
        })
        self._save_job_with_stage(export_report_job, session)
        downloadable_artifact = DownloadableArtifactsModel(ArtifactTypesEnum.project_report, export_report_job.job_id)
        downloadable_artifact.write_record(session)
