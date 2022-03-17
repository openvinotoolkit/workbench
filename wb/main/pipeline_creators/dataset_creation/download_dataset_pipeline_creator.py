"""
 OpenVINO DL Workbench
 Extension pipeline classes for downloading datasets

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

from wb.main.enumerates import PipelineStageEnum
from wb.main.models import ConvertDatasetJobsModel, ValidateDatasetJobsModel
from wb.main.models.datasets.download_dataset_jobs_model import DownloadDatasetJobsModel
from wb.main.pipeline_creators.dataset_creation.dataset_pipeline_creator import DatasetPipelineCreator


class DownloadDatasetPipelineCreator(DatasetPipelineCreator):
    _job_type_to_stage_map = {
        DownloadDatasetJobsModel.get_polymorphic_job_type(): PipelineStageEnum.download_dataset,
        ConvertDatasetJobsModel.get_polymorphic_job_type(): PipelineStageEnum.convert_dataset,
        ValidateDatasetJobsModel.get_polymorphic_job_type(): PipelineStageEnum.validate_dataset,
    }

    _pipeline = [
        DownloadDatasetJobsModel,
        ConvertDatasetJobsModel,
        ValidateDatasetJobsModel,
    ]

