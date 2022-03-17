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
