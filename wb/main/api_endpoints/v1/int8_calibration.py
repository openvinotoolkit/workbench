"""
 OpenVINO DL Workbench
 Endpoints to run Int8 Calibration

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

from wb.error.entry_point_error import InconsistentConfigError
from wb.main.api_endpoints.v1 import V1_INT8CALIBRATION_API
from wb.main.models.target_model import TargetModel
from wb.main.enumerates import TargetTypeEnum
from wb.main.pipeline_creators.dev_cloud_int8_calibration_pipeline_creator import DevCloudInt8CalibrationPipelineCreator
from wb.main.pipeline_creators.int8_calibration_pipeline_creator import Int8CalibrationPipelineCreator
from wb.main.pipeline_creators.local_int8_calibration_pipeline_creator import LocalInt8CalibrationPipelineCreator
from wb.main.pipeline_creators.remote_int8_calibration_pipeline_creator import RemoteInt8CalibrationPipelineCreator
from wb.main.utils.safe_runner import safe_run


def get_pipeline_creator(configuration: dict) -> Int8CalibrationPipelineCreator:
    try:
        target_id = configuration['int8CalibrationConfig']['targetId']
    except KeyError:
        raise InconsistentConfigError('Configuration for inference must contain the targetId field')
    target = TargetModel.query.get(target_id)
    if target.target_type == TargetTypeEnum.dev_cloud:
        return DevCloudInt8CalibrationPipelineCreator(configuration)
    if target.target_type == TargetTypeEnum.remote:
        return RemoteInt8CalibrationPipelineCreator(configuration)
    return LocalInt8CalibrationPipelineCreator(configuration)


@V1_INT8CALIBRATION_API.route('/calibration/int8', methods=['POST'])
@safe_run
def run_int8_calibration():
    data = request.get_json()
    pipeline_creator = get_pipeline_creator(data)
    pipeline_creator.create()
    pipeline_creator.run_pipeline()
    int8_job = pipeline_creator.first_job
    return jsonify({'jobId': int8_job.job_id, 'projectId': int8_job.project_id})
