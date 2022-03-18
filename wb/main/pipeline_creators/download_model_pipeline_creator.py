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

from wb.main.enumerates import PipelineTypeEnum, PipelineStageEnum, ArtifactTypesEnum
from wb.main.models.download_configs_model import ModelDownloadConfigsModel
from wb.main.models.downloadable_artifacts_model import DownloadableArtifactsModel
from wb.main.models.pipeline_model import PipelineModel
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class DownloadModelPipelineCreator(PipelineCreator):
    pipeline_type = PipelineTypeEnum.download_model

    _job_type_to_stage_map = {
        ModelDownloadConfigsModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_profiling_assets,
    }

    def __init__(self, target_id: int, tab_id: int, model_id: int, name: str):
        super().__init__(target_id)
        self.tab_id = tab_id
        self.model_id = model_id
        self.name = name

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        download_job = ModelDownloadConfigsModel({
            'model_id': self.model_id,
            'name': self.name,
            'tab_id': self.tab_id,
            'pipelineId': pipeline.id,
        })
        self._save_job_with_stage(download_job, session)
        downloadable_artifact = DownloadableArtifactsModel(ArtifactTypesEnum.model, download_job.job_id)
        downloadable_artifact.write_record(session)
