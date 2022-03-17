"""
 OpenVINO DL Workbench
 Extension pipeline classes for uploading locally stored user datasets

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
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session

from wb.main.dataset_utils.dataset_adapters import BaseTextDatasetAdapter
from wb.main.enumerates import PipelineStageEnum
from wb.main.models import ConvertDatasetJobsModel, PipelineModel, ExtractDatasetJobsModel, RecognizeDatasetJobsModel, \
    ValidateDatasetJobsModel, ValidateTextDatasetJobsModel
from wb.main.models.datasets.datasets_model import DatasetJobData, TextDatasetJobData, DatasetsModel
from wb.main.models.extract_dataset_jobs_model import ExtractTextDatasetJobsModel
from wb.main.models.datasets.wait_dataset_upload_jobs_model import WaitDatasetUploadJobsModel
from wb.main.pipeline_creators.dataset_creation.dataset_pipeline_creator import DatasetPipelineCreator
from wb.main.shared.enumerates import DatasetTypesEnum


class UploadCVDatasetPipelineCreator(DatasetPipelineCreator):
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


class UploadNLPDatasetPipelineCreator(DatasetPipelineCreator):
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
) -> DatasetPipelineCreator:
    if dataset_type and dataset_type.is_nlp():
        return UploadNLPDatasetPipelineCreator(dataset_id, request_data['settings'])

    return UploadCVDatasetPipelineCreator(dataset_id, dataset_type, dataset_name)
