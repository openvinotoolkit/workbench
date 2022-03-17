"""
 OpenVINO DL Workbench
 Endpoints to run Int8 Calibration

 Copyright (c) 2018 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
