"""
 OpenVINO DL Workbench
 Endpoints to work with inference

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

from wb.main.accuracy import handlers as accuracy_api_handlers
from wb.main.accuracy_report import handlers as accuracy_report_api_handlers
from wb.main.api_endpoints.v1 import V1_ACCURACY_API
from wb.main.utils.safe_runner import safe_run


@V1_ACCURACY_API.route('/projects/<int:project_id>/accuracy/config/raw/validate', methods=['POST'])
@safe_run
def validate_raw_config(project_id: int):
    data = request.get_json()
    return jsonify(accuracy_api_handlers.validate_raw_accuracy_config(project_id, data['config']).to_dict())


@V1_ACCURACY_API.route('/projects/<int:project_id>/accuracy/config/raw', methods=['GET'])
@safe_run
def get_raw_config(project_id: int):
    return jsonify(accuracy_api_handlers.get_raw_accuracy_config(project_id))


@V1_ACCURACY_API.route('/projects/<int:project_id>/accuracy/config/raw', methods=['PUT'])
@safe_run
def set_raw_config(project_id: int):
    data = request.get_json()
    raw_config = data['config']

    accuracy_api_handlers.set_raw_accuracy_config(project_id, raw_config)
    return jsonify(accuracy_api_handlers.get_raw_accuracy_config(project_id))


@V1_ACCURACY_API.route('/projects/<int:project_id>/accuracy/config/raw', methods=['DELETE'])
@safe_run
def delete_raw_config(project_id: int):
    accuracy_api_handlers.delete_raw_accuracy_config(project_id)
    return jsonify({})


@V1_ACCURACY_API.route('/projects/<int:project_id>/accuracy/reports', methods=['GET'])
@safe_run
def get_accuracy_reports(project_id: int):
    reports = accuracy_report_api_handlers.get_reports(project_id)
    return jsonify(reports)


@V1_ACCURACY_API.route('/projects/<int:project_id>/accuracy/reports', methods=['POST'])
@safe_run
def create_accuracy_reports(project_id: int):
    data = request.get_json()
    report_type = data.get('reportType')
    create_report_pipeline = accuracy_report_api_handlers.create_report(project_id, report_type)
    return jsonify(create_report_pipeline.json())


@V1_ACCURACY_API.route('/projects/<int:unused_project_id>/accuracy/reports/<int:report_id>/entities', methods=['GET'])
@safe_run
def get_accuracy_report_entities(unused_project_id: int, report_id: int):
    entities = accuracy_report_api_handlers.query_report_entities(report_id, request.args)
    return jsonify(entities)
