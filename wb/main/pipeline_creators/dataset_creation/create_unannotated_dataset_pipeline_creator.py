"""
 OpenVINO DL Workbench
 Class for pipeline creator for unannotated dataset creation

 Copyright (c) 2021 Intel Corporation

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

from wb.main.enumerates import PipelineTypeEnum, PipelineStageEnum
from wb.main.models import PipelineModel, ValidateDatasetJobsModel, LocalTargetModel, DatasetAugmentationJobModel
from wb.main.models.dataset_augmentation_job_model import DatasetAugmentationJobData
from wb.main.models.datasets_model import DatasetJobData
from wb.main.models.wait_dataset_upload_jobs_model import WaitDatasetUploadJobsModel
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
