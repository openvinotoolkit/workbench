"""
 OpenVINO DL Workbench
 Class for creating pipeline for model report export task

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

from wb.main.models import LocalTargetModel
from wb.main.models.downloadable_artifacts_model import DownloadableArtifactsModel
from wb.main.models.enumerates import PipelineTypeEnum, PipelineStageEnum, ArtifactTypesEnum
from wb.main.models.inference_report_export_job_model import InferenceReportExportJobModel
from wb.main.models.pipeline_model import PipelineModel
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class InferenceReportExportPipelineCreator(PipelineCreator):
    pipeline_type = PipelineTypeEnum.export_inference_report

    _job_type_to_stage_map = {
        InferenceReportExportJobModel.get_polymorphic_job_type(): PipelineStageEnum.export_inference_report,
    }

    def __init__(self, tab_id: int, inference_id: int):
        local_target_model = LocalTargetModel.query.one()
        super().__init__(local_target_model.id)
        self.tab_id = tab_id
        self.inference_id = inference_id

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        export_report_job = InferenceReportExportJobModel({
            'inferenceId': self.inference_id,
            'tabId': self.tab_id,
            'pipelineId': pipeline.id,
        })
        self._save_job_with_stage(export_report_job, session)
        downloadable_artifact = DownloadableArtifactsModel(ArtifactTypesEnum.inference_report, export_report_job.job_id)
        downloadable_artifact.write_record(session)
