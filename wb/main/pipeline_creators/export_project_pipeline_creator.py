"""
 OpenVINO DL Workbench
 Class for creating pipeline for model download task

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

from wb.main.enumerates import PipelineTypeEnum, PipelineStageEnum, ArtifactTypesEnum, TargetTypeEnum
from wb.main.models import TargetModel, DownloadableArtifactsModel, ExportProjectJobModel, PipelineModel
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class ExportProjectPipelineCreator(PipelineCreator):
    pipeline_type = PipelineTypeEnum.export_project

    _job_type_to_stage_map = {
        ExportProjectJobModel.get_polymorphic_job_type(): PipelineStageEnum.export_project,
    }

    def __init__(self, configuration: dict):
        local_target_model = TargetModel.query.filter_by(target_type=TargetTypeEnum.local).first()
        super().__init__(local_target_model.id)
        self.configuration = configuration

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        self.configuration['pipelineId'] = pipeline.id
        download_job = ExportProjectJobModel(self.configuration)
        self._save_job_with_stage(download_job, session)
        downloadable_artifact = DownloadableArtifactsModel(ArtifactTypesEnum.project, download_job.job_id)
        downloadable_artifact.write_record(session)
