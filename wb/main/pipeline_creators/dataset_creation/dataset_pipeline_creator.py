"""
 OpenVINO DL Workbench
 Generic pipeline class for handling datasets

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
from typing import Optional

from sqlalchemy.orm import Session

from wb.main.enumerates import PipelineTypeEnum
from wb.main.models import DatasetsModel, LocalTargetModel, PipelineModel, DatasetJobData
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class DatasetPipelineCreator(PipelineCreator):
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
