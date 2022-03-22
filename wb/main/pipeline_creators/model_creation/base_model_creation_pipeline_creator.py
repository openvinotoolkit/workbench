"""
 OpenVINO DL Workbench
 Class for base model creation pipeline creator

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

from wb.main.enumerates import StatusEnum
from wb.main.models import (TopologyAnalysisJobsModel, LocalTargetModel, WaitModelUploadJobModel,
                            SetupEnvironmentJobModel, AnalyzeModelInputShapeJobModel)
from wb.main.models.setup_environment_job_model import SetupEnvironmentJobData
from wb.main.models.topologies_model import ModelJobData
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class BaseModelCreationPipelineCreator(PipelineCreator):
    def __init__(self):
        local_target_model: LocalTargetModel = LocalTargetModel.query.one()
        super().__init__(local_target_model.id)

    @staticmethod
    def check_running_environment_setup_job(session):
        number_running_jobs = session.query(SetupEnvironmentJobModel).filter(
            SetupEnvironmentJobModel.status.in_([StatusEnum.running, StatusEnum.queued])
        ).count()
        if number_running_jobs:
            raise AssertionError('Setup environment job is already running')

    def create_environment_setup_job(self, session: Session,
                                     model_id: int,
                                     previous_job_id: int = None) -> SetupEnvironmentJobModel:
        self.check_running_environment_setup_job(session)
        create_environment_job = SetupEnvironmentJobModel(SetupEnvironmentJobData(
            pipelineId=self.pipeline.id,
            previousJobId=previous_job_id,
            projectId=None,
            modelId=model_id
        ))
        self._save_job_with_stage(create_environment_job, session)
        return create_environment_job

    @staticmethod
    def create_model_input_shape_analysis_job(pipeline_id: int, model_id: int,
                                              previous_job_id: int = None):
        return AnalyzeModelInputShapeJobModel(ModelJobData(
            modelId=model_id,
            pipelineId=pipeline_id,
            previousJobId=previous_job_id,
            projectId=None,
        ))

    @staticmethod
    def create_model_analysis_job(pipeline_id: int, model_id: int,
                                  previous_job_id: int = None) -> TopologyAnalysisJobsModel:

        return TopologyAnalysisJobsModel(ModelJobData(
            modelId=model_id,
            pipelineId=pipeline_id,
            previousJobId=previous_job_id,
            projectId=None,
        ))

    @staticmethod
    def create_upload_model_job(model_id: int, pipeline_id: int) -> WaitModelUploadJobModel:
        return WaitModelUploadJobModel(ModelJobData(
            modelId=model_id,
            pipelineId=pipeline_id,
            previousJobId=None,
            projectId=None
        ))
