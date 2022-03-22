"""
 OpenVINO DL Workbench
 Endpoints to work with remote job

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
from typing import List

from flask import jsonify, request

from wb.error.request_error import NotFoundRequestError
from wb.extensions_factories.database import get_db_session_for_app
from wb.main.api_endpoints.utils import save_artifact_chunk_upload
from wb.main.api_endpoints.v1 import V1_REMOTE_JOB_API
from wb.main.enumerates import StatusEnum
from wb.main.models import JobsModel
from wb.main.models.downloadable_artifacts_model import DownloadableArtifactsModel
from wb.main.models.files_model import FilesModel
from wb.main.models.parse_dev_cloud_result_job_model import ParseDevCloudResultJobModel
from wb.main.utils.safe_runner import safe_run
from wb.main.utils.utils import create_empty_dir, FileSizeConverter


@V1_REMOTE_JOB_API.route('/remote-job/finish', methods=['POST'])
@safe_run
def set_remote_job_ready():
    data = request.get_json()
    wb_pipeline_id = data['wbPipelineId']
    job_models: List[ParseDevCloudResultJobModel] = (
        ParseDevCloudResultJobModel.query.filter_by(pipeline_id=wb_pipeline_id).all()
    )
    if not job_models:
        raise NotFoundRequestError(f'No job found for provided pipeline id: {wb_pipeline_id}')

    for job_model in job_models:
        parent_job: JobsModel = JobsModel.query.get(job_model.parent_job)
        if not parent_job:
            raise NotFoundRequestError(f'No job found for provided pipeline id: {wb_pipeline_id}')
        if parent_job.status == StatusEnum.running:
            break
    else:
        raise NotFoundRequestError(f'No job found for provided pipeline id: {wb_pipeline_id}')

    job_model.are_results_obtained = True
    job_model.write_record(session=get_db_session_for_app())

    return jsonify({})


@V1_REMOTE_JOB_API.route('/remote-job-result/upload', methods=['POST'])
@safe_run
def upload_remote_job_result():
    data = request.get_json()
    wb_pipeline_id = data['wbPipelineId']
    files = data['files']
    job_models: List[ParseDevCloudResultJobModel] = (
        ParseDevCloudResultJobModel.query.filter_by(pipeline_id=wb_pipeline_id).all()
    )

    # find a particular job from a big pipeline (int8+profiling) for this artifact
    if not job_models:
        raise NotFoundRequestError(f'No job found for provided pipeline id: {wb_pipeline_id}')

    for job_model in job_models:
        parent_job: JobsModel = JobsModel.query.get(job_model.parent_job)
        if not parent_job:
            raise NotFoundRequestError(f'No job found for provided pipeline id: {wb_pipeline_id}')
        if parent_job.status == StatusEnum.running:
            break
    else:
        raise NotFoundRequestError(f'No job found for provided pipeline id: {wb_pipeline_id}')

    remote_job_result_artifact: DownloadableArtifactsModel = job_model.result_artifact
    if not remote_job_result_artifact:
        return 'No artifacts found for provided pipeline id', 404
    # Create file model for uploading artifact
    files_ids = FilesModel.create_files(files, remote_job_result_artifact.id, remote_job_result_artifact.path)
    remote_job_result_artifact.size = FileSizeConverter.bytes_to_mb(
        sum([f.size for f in remote_job_result_artifact.files])
    )
    remote_job_result_artifact.write_record(get_db_session_for_app())
    create_empty_dir(remote_job_result_artifact.path)
    return jsonify({'artifactItem': remote_job_result_artifact.json(), 'files': files_ids})


@V1_REMOTE_JOB_API.route('/remote-job-result/upload/<int:file_id>', methods=['POST'])
@safe_run
def upload_remote_job_result_chunk(file_id: int):
    file_record = FilesModel.query.get(file_id)
    if not file_record:
        raise NotFoundRequestError(f'File record with id {file_id} was not found on the database')
    save_artifact_chunk_upload(request, file_id)
    artifact = file_record.artifact
    if artifact.is_all_files_uploaded:
        job_model = ParseDevCloudResultJobModel.query.filter_by(result_artifact_id=artifact.id).first()
        job_model.are_results_obtained = True
        job_model.write_record(session=get_db_session_for_app())
    return jsonify({})
