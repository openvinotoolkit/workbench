"""
 OpenVINO DL Workbench
 Endpoints to work with huggingface

 Copyright (c) 2022 Intel Corporation

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

from flask import jsonify, send_file, request

from config.constants import MODEL_DOWNLOADS_FOLDER
from wb.extensions_factories.database import get_db_session_for_app
from wb.main.api_endpoints.v1 import V1_HUGGINGFACE_API
from wb.main.enumerates import SupportedFrameworksEnum, ModelSourceEnum, ModelDomainEnum
from wb.main.huggingface_api import huggingface_api
from wb.main.models import TopologiesMetaDataModel, TopologiesModel
from wb.main.pipeline_creators.model_creation.import_huggingface_model_pipeline_creator import \
    ImportHuggingfaceModelPipelineCreator
from wb.main.utils.safe_runner import safe_run, safe_run_configurable


@V1_HUGGINGFACE_API.route('/huggingface/models', methods=['GET'])
@safe_run
def get_models():
    models = huggingface_api.get_models()
    return jsonify(models)


@V1_HUGGINGFACE_API.route('/huggingface/readme', methods=['GET'])
@safe_run_configurable(emit_web_socket=False)
def get_model_details():
    model_id = request.args['id']
    readme = huggingface_api.get_model_details(model_id)
    return send_file(readme, mimetype='text/markdown')


@V1_HUGGINGFACE_API.route('/huggingface/model-tags', methods=['GET'])
@safe_run
def get_tags():
    tags = huggingface_api.get_tags()
    return jsonify(tags)


@V1_HUGGINGFACE_API.route('/huggingface/models/import', methods=['POST'])
@safe_run
def import_huggingface_model():
    huggingface_model_id = request.get_json()['id']

    metadata = TopologiesMetaDataModel()
    metadata.write_record(get_db_session_for_app())

    # for the moment we support only nlp onnx models form huggingface hub, so values are hardcoded
    topology = TopologiesModel(huggingface_model_id, SupportedFrameworksEnum.onnx, metadata.id)
    topology.source = ModelSourceEnum.huggingface
    topology.domain = ModelDomainEnum.NLP

    topology.write_record(get_db_session_for_app())
    topology.path = os.path.join(MODEL_DOWNLOADS_FOLDER, str(topology.id))
    topology.write_record(get_db_session_for_app())

    pipeline_creator = ImportHuggingfaceModelPipelineCreator(
        model_id=topology.id,
        huggingface_model_id=huggingface_model_id,
        model_name=topology.name,
    )
    pipeline_creator.create()
    pipeline_creator.run_pipeline()

    model_json = pipeline_creator.result_model.short_json()
    return jsonify({
        **model_json,
        'modelOptimizerJobId': pipeline_creator.model_optimizer_job_id,
    })
