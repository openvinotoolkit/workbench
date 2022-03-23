"""
 OpenVINO DL Workbench
 Class for creating ORM basic pipeline model and dependent models

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
import os
from abc import abstractmethod
from typing import List, Optional, Type, Dict

from celery import chain
from celery.canvas import Signature
from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_session_for_app
from wb.main.enumerates import (ArtifactTypesEnum, PipelineTypeEnum, PipelineStageEnum, StatusEnum,
                                OptimizationTypesEnum)
from wb.main.models.downloadable_artifacts_model import DownloadableArtifactsModel
from wb.main.models.job_execution_details_model import JobExecutionDetailsModel
from wb.main.models.jobs_model import JobsModel
from wb.main.models.pipeline_model import PipelineModel
from wb.main.models.projects_model import ProjectsModel
from wb.main.models.target_model import TargetModel
from wb.main.models.upload_artifact_to_target_job_model import UploadArtifactToTargetJobModel
from wb.main.tasks.task import TASK


class PipelineCreator:
    pipeline_type: PipelineTypeEnum = None

    _job_type_to_stage_map = {}
    _specific_job_model_to_job_type_map = {}

    def __init__(self, target_id: int):
        self._target_id = target_id
        self.created_jobs: List[JobsModel] = []
        self.pipeline = None

    @classmethod
    def get_specific_job_models_to_job_type(cls) -> Dict[str, str]:
        return cls._specific_job_model_to_job_type_map

    @property
    def pipeline_stages(self) -> List[PipelineStageEnum]:
        return list(self._job_type_to_stage_map.values())

    @classmethod
    def get_pipeline_stage_map(cls) -> Dict[PipelineStageEnum, PipelineStageEnum]:
        return cls._job_type_to_stage_map

    @classmethod
    def get_pipeline_stage_for_job_type(cls, job_type: str) -> Optional[PipelineStageEnum]:
        return cls._job_type_to_stage_map.get(job_type)

    def create(self) -> PipelineModel:
        session = get_db_session_for_app()
        self.pipeline = PipelineModel(self._target_id, self.pipeline_type)
        self.pipeline.write_record(session)
        self._create_pipeline_jobs(self.pipeline, session)
        return self.pipeline

    @abstractmethod
    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        raise NotImplementedError

    def _save_job_with_stage(self, job: JobsModel, session: Session):
        job.write_record(session)
        job_execution_details: JobExecutionDetailsModel = session.query(JobExecutionDetailsModel).get(job.job_id)
        if job_execution_details:
            job_execution_details.stage = self.get_pipeline_stage_for_job_type(job.job_type)
            job_execution_details.write_record(session)
        self.created_jobs.append(job)

    def run_pipeline(self):
        for job in self.created_jobs:
            if job.execution_details:
                job.execution_details.status = StatusEnum.queued
        JobsModel.write_records(self.created_jobs, get_db_session_for_app())
        tasks: List[Signature] = list(map(self._create_task_from_job_model, self.created_jobs))
        chain(tasks).apply_async()

    @classmethod
    def _get_task_args_from_job_model(cls, job_model: JobsModel) -> List:
        job_type = cls._specific_job_model_to_job_type_map.get(job_model.job_type, job_model.job_type)
        return [job_type, job_model.job_id]

    def _create_task_from_job_model(self, job_model: JobsModel) -> Signature:
        task_args = self._get_task_args_from_job_model(job_model)
        if job_model == self.first_job:
            task_args.insert(0, None)
        return TASK.subtask(args=tuple(task_args))

    @property
    def first_job(self) -> JobsModel:
        return self.created_jobs[0]

    @staticmethod
    def create_project_and_save_to_configuration(configuration: dict,
                                                 session: Session,
                                                 optimization_type: OptimizationTypesEnum
                                                 = OptimizationTypesEnum.inference) -> int:
        project_id = ProjectsModel.find_or_create_project(model_id=configuration['modelId'],
                                                          dataset_id=configuration['datasetId'],
                                                          target_id=configuration['targetId'],
                                                          device_id=configuration['deviceId'],
                                                          job_type=optimization_type,
                                                          session=session)
        return project_id

    def _create_pipeline_jobs_for_uploading_bundle(self,
                                                   pipeline_id: int,
                                                   target_id: int,
                                                   project_id: int,
                                                   create_job_bundle_model_class: Type[JobsModel],
                                                   session: Session,
                                                   previous_job: int = None) -> int:
        create_profiling_bundle_job = create_job_bundle_model_class({
            'projectId': project_id,
            'pipelineId': pipeline_id,
            'previousJobId': previous_job,
        })
        self._save_job_with_stage(create_profiling_bundle_job, session)

        bundle = DownloadableArtifactsModel(ArtifactTypesEnum.job_bundle,
                                            job_id=create_profiling_bundle_job.job_id)
        bundle.write_record(session)

        target = TargetModel.query.get(target_id)

        upload_artifact_to_target_job = UploadArtifactToTargetJobModel({
            'projectId': project_id,
            'artifactId': bundle.id,
            'targetId': target_id,
            'pipelineId': pipeline_id,
            'previousJobId': create_profiling_bundle_job.job_id,
            'destinationDirectory': os.path.join(target.bundle_path, str(pipeline_id)),
        })
        self._save_job_with_stage(upload_artifact_to_target_job, session)
        return upload_artifact_to_target_job.job_id
