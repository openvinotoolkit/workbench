"""
 OpenVINO DL Workbench
 Class for download log task pipeline creator

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

from wb.extensions_factories.database import get_db_session_for_app
from wb.main.enumerates import PipelineTypeEnum, PipelineStageEnum, ArtifactTypesEnum
from wb.main.models.download_log_job_model import DownloadLogJobModel
from wb.main.models.downloadable_artifacts_model import DownloadableArtifactsModel
from wb.main.models.pipeline_model import PipelineModel
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class DownloadLogPipelineCreator(PipelineCreator):
    pipeline_type = PipelineTypeEnum.download_log

    _job_type_to_stage_map = {
        DownloadLogJobModel.get_polymorphic_job_type(): PipelineStageEnum.download_log,
    }

    def __init__(self, target_id: int, tab_id: dict):
        super().__init__(target_id)
        self.tab_id = tab_id

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        download_log_job = DownloadLogJobModel({
            'tabId': self.tab_id,
            'pipelineId': pipeline.id,
        })
        self._save_job_with_stage(download_log_job, session)
        downloadable_artifact = DownloadableArtifactsModel(ArtifactTypesEnum.log, download_log_job.job_id)
        downloadable_artifact.write_record(get_db_session_for_app())
