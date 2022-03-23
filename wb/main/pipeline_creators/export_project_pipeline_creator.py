"""
 OpenVINO DL Workbench
 Class for creating pipeline for model download task

 Copyright (c) 2020 Intel Corporation

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
