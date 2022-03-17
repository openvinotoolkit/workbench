"""
 OpenVINO DL Workbench
 Endpoints to work with model downloader

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
import json

from flask import request, jsonify

from wb.extensions_factories.database import get_db_session_for_app
from wb.main.api_endpoints.v1 import V1_MODELS_API
from wb.main.console_tool_wrapper.model_downloader.utils import fetch_downloadable_models, aggregate_topologies
from wb.main.enumerates import SupportedFrameworksEnum, ModelPrecisionEnum
from wb.main.models import OMZModelConvertJobModel, OMZTopologyModel
from wb.main.pipeline_creators.model_creation.omz_model_ir_pipeline_creator import \
    OMZModelIRPipelineCreator
from wb.main.pipeline_creators.model_creation.omz_model_original_pipeline_creator import \
    OMZModelOriginalPipelineCreator
from wb.main.utils.safe_runner import safe_run


@V1_MODELS_API.route('/downloader-models', methods=['GET'])
@safe_run
def list_download_models():
    if not OMZTopologyModel.query.all():
        fetch_downloadable_models()
    result = aggregate_topologies()
    return jsonify(result)


@V1_MODELS_API.route('/downloader-models', methods=['POST'])
@safe_run
def download_model():
    data = request.get_json()
    precision = data['precision']
    model_name = data['modelName']
    topologies = OMZTopologyModel.query.filter_by(name=model_name).all()

    for topology_record in topologies:
        # TODO: rework in case there are pure INT8 alongside with FP32-INT8 models
        precisions = [x.precision.value for x in sorted(topology_record.precisions, key=lambda record: record.id)]
        if precision in precisions:
            # Check for full precision (FP16 and FP32) is needed not to download FP32-INT8 model in case
            # if user requested to download FP32 model
            if precision in (ModelPrecisionEnum.fp16.value, ModelPrecisionEnum.fp32.value) and \
                    ModelPrecisionEnum.i8.value in precisions:
                continue
            topology = topology_record
            precision_in_downloader_format = '-'.join(precisions)
            break
    else:
        return 'No topology found with matching precisions', 404

    if topology.framework == SupportedFrameworksEnum.openvino:
        pipeline_creator = OMZModelIRPipelineCreator(topology, model_name, precision_in_downloader_format)
    else:
        pipeline_creator = OMZModelOriginalPipelineCreator(topology, model_name, precision_in_downloader_format)
    pipeline_creator.create()
    pipeline_creator.run_pipeline()

    result = pipeline_creator.result_model.short_json()
    return jsonify(result)


def convert_downloaded_model(data: dict):
    topology_id = data['topologyId']
    convert_job_record = OMZModelConvertJobModel.query.filter_by(result_model_id=topology_id).first()
    convert_job_record.conversion_args = json.dumps(({
        'precision': data['dataType'],
    }))
    convert_job_record.write_record(get_db_session_for_app())
    return jsonify({})
