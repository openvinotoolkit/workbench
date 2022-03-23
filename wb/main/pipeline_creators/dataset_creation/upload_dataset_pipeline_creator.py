"""
 OpenVINO DL Workbench
 Class for creating ORM create dataset pipeline creator

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
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session

from wb.main.dataset_utils.dataset_adapters import BaseTextDatasetAdapter
from wb.main.enumerates import PipelineTypeEnum, PipelineStageEnum
from wb.main.models import ConvertDatasetJobsModel, PipelineModel, ExtractDatasetJobsModel, RecognizeDatasetJobsModel, \
    ValidateDatasetJobsModel, LocalTargetModel, ValidateTextDatasetJobsModel
from wb.main.models.datasets_model import DatasetJobData, TextDatasetJobData, DatasetsModel
from wb.main.models.extract_dataset_jobs_model import ExtractTextDatasetJobsModel
from wb.main.models.wait_dataset_upload_jobs_model import WaitDatasetUploadJobsModel
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator
from wb.main.shared.enumerates import DatasetTypesEnum


class UploadDatasetPipelineCreator(PipelineCreator):
    pipeline_type = PipelineTypeEnum.upload_dataset
    _result_dataset: Optional[DatasetsModel] = None

    _job_type_to_stage_map = {}

    _pipeline = []

    def __init__(self, dataset_id: int):
        local_target_model = LocalTargetModel.query.one()
        super().__init__(local_target_model.id)
        self.dataset_id = dataset_id

    def get_dataset_job_data(self, pipeline: PipelineModel) -> DatasetJobData:
        job_data = DatasetJobData(
            datasetId=self.dataset_id,
            pipelineId=pipeline.id,
            previousJobId=None,
            projectId=None
        )
        return job_data

    def _create_pipeline_jobs(
            self,
            pipeline: PipelineModel,
            session: Session,
    ):
        dataset_job_data = self.get_dataset_job_data(pipeline)
        for stage_model in self._pipeline:
            stage = stage_model(dataset_job_data)
            self._save_job_with_stage(stage, session)
            dataset_job_data['previousJobId'] = stage.job_id

    @property
    def result_dataset(self) -> DatasetsModel:
        return self._result_dataset


class UploadCVDatasetPipelineCreator(UploadDatasetPipelineCreator):
    _job_type_to_stage_map = {
        WaitDatasetUploadJobsModel.get_polymorphic_job_type(): PipelineStageEnum.wait_dataset_upload,
        ExtractDatasetJobsModel.get_polymorphic_job_type(): PipelineStageEnum.extract_dataset,
        RecognizeDatasetJobsModel.get_polymorphic_job_type(): PipelineStageEnum.recognize_dataset,
        ConvertDatasetJobsModel.get_polymorphic_job_type(): PipelineStageEnum.convert_dataset,
        ValidateDatasetJobsModel.get_polymorphic_job_type(): PipelineStageEnum.validate_dataset,
    }

    _pipeline = [
        WaitDatasetUploadJobsModel,
        ExtractDatasetJobsModel,
        RecognizeDatasetJobsModel,
        ConvertDatasetJobsModel,
        ValidateDatasetJobsModel,
    ]

    def __init__(
            self,
            dataset_id: int,
            dataset_type: Optional[DatasetTypesEnum] = None,
            dataset_name: Optional[str] = None
    ):
        super().__init__(dataset_id)
        self.dataset_name = dataset_name
        self.dataset_type = dataset_type

    def create_resulting_dataset(self, session: Session):
        self._result_dataset = DatasetsModel(self.dataset_name)
        self._result_dataset.converted_from_id = self.dataset_id
        self._result_dataset.write_record(session)

    def get_dataset_job_data(self, pipeline: PipelineModel) -> DatasetJobData:
        result_dataset_id = self.result_dataset.id if self.result_dataset else None
        job_data = DatasetJobData(
            **super().get_dataset_job_data(pipeline),
            resultDatasetId=result_dataset_id,
        )
        return job_data

    def _create_pipeline_jobs(
            self,
            pipeline: PipelineModel,
            session: Session,
    ):
        # Create result dataset if dataset name was passed
        if self.dataset_name:
            self.create_resulting_dataset(session)

        super()._create_pipeline_jobs(pipeline, session)


class UploadNLPDatasetPipelineCreator(UploadDatasetPipelineCreator):
    _job_type_to_stage_map = {
        WaitDatasetUploadJobsModel.get_polymorphic_job_type(): PipelineStageEnum.wait_dataset_upload,
        ExtractTextDatasetJobsModel.get_polymorphic_job_type(): PipelineStageEnum.extract_text_dataset,
        ValidateTextDatasetJobsModel.get_polymorphic_job_type(): PipelineStageEnum.validate_text_dataset,
    }

    _pipeline = [
        WaitDatasetUploadJobsModel,
        ExtractTextDatasetJobsModel,
        ValidateTextDatasetJobsModel,
    ]

    def __init__(self, dataset_id: int, settings: Dict[str, Any]):
        super().__init__(dataset_id)
        self.settings = settings

    def get_dataset_job_data(self, pipeline: PipelineModel) -> TextDatasetJobData:
        return TextDatasetJobData(
                **super().get_dataset_job_data(pipeline),
                **BaseTextDatasetAdapter.get_dataset_job_data(self.settings)
            )


def get_upload_dataset_pipeline_creator(
        dataset_id: int,
        dataset_name: str,
        dataset_type: Optional[DatasetTypesEnum] = None,
        request_data: Optional[Dict[str, Any]] = None,
) -> UploadDatasetPipelineCreator:
    if dataset_type and dataset_type.is_nlp():
        return UploadNLPDatasetPipelineCreator(dataset_id, request_data['settings'])

    return UploadCVDatasetPipelineCreator(dataset_id, dataset_type, dataset_name)
