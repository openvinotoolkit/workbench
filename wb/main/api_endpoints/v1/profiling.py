"""
 OpenVINO DL Workbench
 Endpoints to work with inference

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
from flask import jsonify, request

from config.constants import CLOUD_SERVICE_URL
from wb.error.dev_cloud_errors import DevCloudGeneralError
from wb.error.entry_point_error import InconsistentConfigError
from wb.error.request_error import BadRequestError
from wb.main.api_endpoints.utils import md5
from wb.main.api_endpoints.v1 import V1_PROFILING_API
from wb.main.enumerates import TargetTypeEnum
from wb.main.models import CreateProfilingBundleJobModel, ProjectsModel, SingleInferenceInfoModel, TargetModel
from wb.main.pipeline_creators.dev_cloud_profiling_pipeline_creator import DevCloudProfilingPipelineCreator
from wb.main.pipeline_creators.local_profiling_pipeline_creator import LocalProfilingPipelineCreator
from wb.main.pipeline_creators.profiling_pipeline_creator import ProfilingPipelineCreator, ProfilingConfiguration
from wb.main.pipeline_creators.remote_profiling_pipeline_creator import RemoteProfilingPipelineCreator
from wb.main.utils.safe_runner import safe_run


def get_profiling_configuration(data: dict) -> ProfilingConfiguration:
    try:
        profiling_configuration = ProfilingConfiguration(
            datasetId=data['datasetId'],
            modelId=data['modelId'],
            deviceId=data['deviceId'],
            targetId=data['targetId'],
            deviceName=data['deviceName'],
            inferences=data['inferences'],
            inferenceTime=data['inferenceTime'],
            projectId=None,
        )
    except KeyError as error:
        raise BadRequestError(f'Invalid key {error} in profiling configuration')
    return profiling_configuration


def get_pipeline_creator(configuration: ProfilingConfiguration) -> ProfilingPipelineCreator:
    try:
        target_id = configuration['targetId']
    except KeyError:
        raise InconsistentConfigError('Configuration for inference must contain the targetId field')
    target = TargetModel.query.get(target_id)
    if CLOUD_SERVICE_URL and target.target_type != TargetTypeEnum.dev_cloud:
        raise DevCloudGeneralError('Local profiling is forbidden in DevCloud')
    if target.target_type == TargetTypeEnum.local:
        return LocalProfilingPipelineCreator(configuration)
    if target.target_type == TargetTypeEnum.dev_cloud:
        return DevCloudProfilingPipelineCreator(configuration)
    return RemoteProfilingPipelineCreator(configuration)


@V1_PROFILING_API.route('/profile', methods=['POST'])
@safe_run
def run_compound_inference():
    data: dict = request.get_json()
    profiling_configuration = get_profiling_configuration(data)
    pipeline_creator = get_pipeline_creator(profiling_configuration)
    pipeline_creator.create()
    pipeline_creator.run_pipeline()

    project_id = pipeline_creator.project_id
    profiling_job_id = pipeline_creator.profiling_job_id
    project = ProjectsModel.query.get(project_id)
    original_model_id = project.get_top_level_model_id()

    return jsonify({
        'jobId': profiling_job_id,
        'projectId': project_id,
        'originalModelId': original_model_id
    })


@V1_PROFILING_API.route('/inference-history/<int:project_id>', methods=['GET'])
@safe_run
def get_jobs_by_project_id(project_id: int):
    inferences = SingleInferenceInfoModel.query. \
        filter(SingleInferenceInfoModel.project_id == project_id). \
        all()
    return jsonify([i.short_json() for i in inferences])


@V1_PROFILING_API.route('/check-sum/profiling-bundle', methods=['POST'])
@safe_run
def check_sum_profiling_bundle():
    data = request.get_json()
    project_id = data['projectId']
    md5sum = None
    job = CreateProfilingBundleJobModel.query.filter_by(project_id=project_id).first()
    if job:
        bundle = job.shared_artifact
        exists, _ = bundle.archive_exists()
        if exists:
            md5sum = md5(bundle.path)
    return jsonify({'hash': md5sum})
