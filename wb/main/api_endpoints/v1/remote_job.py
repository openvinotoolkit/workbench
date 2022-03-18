"""
 OpenVINO DL Workbench
 Endpoints to work with remote job

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
from typing import List

from flask import jsonify, request

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
        return no_job_found_response()

    for job_model in job_models:
        parent_job: JobsModel = JobsModel.query.get(job_model.parent_job)
        if not parent_job:
            return no_job_found_response()
        if parent_job.status == StatusEnum.running:
            break
    else:
        return no_job_found_response()

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


def no_job_found_response():
    return 'No job found for provided pipeline id', 404


@V1_REMOTE_JOB_API.route('/remote-job-result/upload/<int:file_id>', methods=['POST'])
@safe_run
def upload_remote_job_result_chunk(file_id: int):
    file_record = FilesModel.query.get(file_id)
    if not file_record:
        return 'File record with id {} was not found on the database'.format(file_id), 404
    save_artifact_chunk_upload(request, file_id)
    return jsonify({})
