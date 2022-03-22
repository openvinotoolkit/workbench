"""
 OpenVINO DL Workbench
 Endpoints for cancellation of jobs and uploading

 Copyright (c) 2018 Intel Corporation

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
from typing import List, Optional, Tuple

from flask import jsonify

from wb.error.request_error import NotFoundRequestError
from wb.extensions_factories.database import get_db_session_for_app
from wb.main.api_endpoints.v1 import V1_CANCEL_API
from wb.main.enumerates import JobTypesEnum, StatusEnum, TargetTypeEnum
from wb.main.jobs.utils.database_functions import set_status_in_db, set_statuses_in_db
from wb.main.models import (ArtifactsModel, JobsModel, OMZModelDownloadJobModel, ModelOptimizerJobModel,
                            SingleInferenceInfoModel, ProfilingJobModel, TargetModel, TopologiesModel, PipelineModel)
from wb.main.tasks.task import cancel_celery_task
from wb.main.utils.dev_cloud_http_service import DevCloudHttpService
from wb.main.utils.safe_runner import safe_run


@V1_CANCEL_API.route('/cancel-uploading/<int:artifact_id>', methods=['PUT'])
@safe_run
def cancel_uploading(artifact_id: int):
    artifact: ArtifactsModel = ArtifactsModel.query.get(artifact_id)
    if not artifact:
        raise NotFoundRequestError(f'Artifact with id {artifact_id} was not found')

    cancel_artifacts_uploads(artifacts_ids=(artifact_id,))
    return jsonify({'id': artifact_id})


@V1_CANCEL_API.route('/cancel-job/<int:job_id>', methods=['PUT'])
@safe_run
def cancel_job(job_id: int):
    job: JobsModel = JobsModel.query.get(job_id)
    if not job:
        raise NotFoundRequestError(f'Job with id {job_id} was not found')

    cancel_jobs_by_id(job_ids=(job_id,))
    return jsonify({'jobId': job_id})


def cancel_jobs_by_id(job_ids: Tuple[int], force: bool = False):
    jobs: List[JobsModel] = JobsModel.query.filter(JobsModel.job_id.in_(job_ids)).all()
    for job in jobs:
        cancel_pipeline(pipeline=job.pipeline, force=force)


def cancel_pipeline(pipeline: PipelineModel, force: bool = False):
    job_target: TargetModel = pipeline.target
    # Cancel DevCloud remote job
    if job_target.target_type == TargetTypeEnum.dev_cloud:
        DevCloudHttpService.cancel_remote_job(wb_pipeline_id=pipeline.id)
    # Cancel other pipeline jobs
    pipeline_jobs: List[JobsModel] = pipeline.jobs
    tasks_to_cancel = [job.task_id for job in pipeline_jobs if job.task_id]
    cancel_celery_task(tasks=tasks_to_cancel, force=force)


def cancel_job_in_db(job_id: int):
    job_model: JobsModel = JobsModel.query.get(job_id)
    if job_model.job_type == JobTypesEnum.profiling_type.value:
        set_status_in_db(ProfilingJobModel, job_model.job_id, StatusEnum.cancelled, get_db_session_for_app(),
                         force=True)
        for single_profiling_result in job_model.profiling_results:
            if single_profiling_result.status != StatusEnum.ready:
                set_status_in_db(SingleInferenceInfoModel, single_profiling_result.job_id, StatusEnum.cancelled,
                                 get_db_session_for_app(), force=True)
        return
    set_status_in_db(JobsModel, job_id, StatusEnum.cancelled, get_db_session_for_app(), force=True)


def cancel_artifacts_uploads(artifacts_ids: Tuple[int], force: bool = False):
    artifacts: List[ArtifactsModel] = ArtifactsModel.query.filter(ArtifactsModel.id.in_(artifacts_ids)).all()

    tasks_to_cancel = [artifact.task_id for artifact in artifacts if artifact.task_id]

    cancel_celery_task(tasks=tasks_to_cancel, force=force)

    set_statuses_in_db(artifacts, StatusEnum.cancelled, get_db_session_for_app())

    topologies: List[TopologiesModel] = TopologiesModel.query.filter(TopologiesModel.id.in_(artifacts_ids))
    for topology in filter(None, topologies):
        model_optimizer_jobs: Optional[List[ModelOptimizerJobModel]] = topology.mo_jobs_from_result
        if model_optimizer_jobs:
            running_mo_jobs = (job for job in model_optimizer_jobs if
                               job.status in (StatusEnum.queued, StatusEnum.running))
            for job in running_mo_jobs:
                set_status_in_db(ModelOptimizerJobModel, job.job_id,
                                 StatusEnum.cancelled, get_db_session_for_app())
        model_downloader_job = topology.model_downloader_job
        if model_downloader_job:
            set_status_in_db(OMZModelDownloadJobModel, model_downloader_job.job_id,
                             StatusEnum.cancelled, get_db_session_for_app())
