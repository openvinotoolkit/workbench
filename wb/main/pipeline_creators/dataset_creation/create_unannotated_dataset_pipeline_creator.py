"""
 OpenVINO DL Workbench
 Class for pipeline creator for unannotated dataset creation

 Copyright (c) 2021 Intel Corporation

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

from wb.main.enumerates import PipelineTypeEnum, PipelineStageEnum
from wb.main.models import PipelineModel, ValidateDatasetJobsModel, LocalTargetModel, DatasetAugmentationJobModel
from wb.main.models.datasets.dataset_augmentation_job_model import DatasetAugmentationJobData
from wb.main.models.datasets.datasets_model import DatasetJobData
from wb.main.models.datasets.wait_dataset_upload_jobs_model import WaitDatasetUploadJobsModel
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class CreateUnannotatedDatasetPipelineCreator(PipelineCreator):
    pipeline_type = PipelineTypeEnum.upload_dataset

    _job_type_to_stage_map = {
        WaitDatasetUploadJobsModel.get_polymorphic_job_type(): PipelineStageEnum.wait_dataset_upload,
        ValidateDatasetJobsModel.get_polymorphic_job_type(): PipelineStageEnum.validate_dataset,
        DatasetAugmentationJobModel.get_polymorphic_job_type(): PipelineStageEnum.augment_dataset,
    }

    def __init__(self, dataset_id: int, augmentation_config: DatasetAugmentationJobData):
        local_target_model = LocalTargetModel.query.one()
        super().__init__(local_target_model.id)
        self.dataset_id = dataset_id
        self.augmentation_config = augmentation_config

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        upload_dataset_job = WaitDatasetUploadJobsModel(DatasetJobData(
            datasetId=self.dataset_id,
            resultDatasetId=None,
            pipelineId=pipeline.id,
            previousJobId=None,
            projectId=None
        ))
        self._save_job_with_stage(upload_dataset_job, session)

        augment_dataset_job = DatasetAugmentationJobModel(DatasetJobData(
            datasetId=self.dataset_id,
            resultDatasetId=None,
            pipelineId=pipeline.id,
            previousJobId=upload_dataset_job.job_id,
            projectId=None
        ), DatasetAugmentationJobData(**self.augmentation_config))
        self._save_job_with_stage(augment_dataset_job, session)
        dataset_validator_job = ValidateDatasetJobsModel(DatasetJobData(
            datasetId=self.dataset_id,
            resultDatasetId=None,
            pipelineId=pipeline.id,
            previousJobId=augment_dataset_job.job_id,
            projectId=None
        ))
        self._save_job_with_stage(dataset_validator_job, session)
