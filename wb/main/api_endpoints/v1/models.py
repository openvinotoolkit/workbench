"""
 OpenVINO DL Workbench
 Endpoints to work with models

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
import json
import logging
import os
from functools import reduce
from typing import List, Union, Dict, Tuple

from flask import jsonify, request
from sqlalchemy import and_, not_

from config.constants import UPLOAD_FOLDER_MODELS, ORIGINAL_FOLDER, UPLOAD_FOLDER_TOKENIZERS
from wb.error.request_error import NotFoundRequestError, InternalServerRequestError, BadRequestError
from wb.extensions_factories.database import get_db_session_for_app
from wb.main.api_endpoints.utils import (try_load_configuration, on_new_chunk_received, delete_model_from_db,
                                         fill_model_job_details)
from wb.main.api_endpoints.v1 import V1_MODELS_API
from wb.main.enumerates import (SupportedFrameworksEnum, ModelSourceEnum, StatusEnum, TF2FilesKeysEnum,
                                TokenizerTypeEnum, AcceptableFileSizesMb, LayoutDimValuesEnum, ModelDomainEnum)
from wb.main.environment.manifest import ManifestFactory, ManifestDumper
from wb.main.models import (FilesModel, TopologiesMetaDataModel, TopologiesModel, TokenizerModel,
                            TokenizerToTopologyModel, ArtifactsModel, ModelShapeConfigurationModel)
from wb.main.models.model_shape_configuration_model import InputShapeConfiguration
from wb.main.models.topologies_metadata_model import InputLayoutConfiguration
from wb.main.pipeline_creators.model_creation import (UploadIRModelPipelineCreator, UploadKerasModelPipelineCreator,
                                                      UploadOriginalModelPipelineCreator, ConfigureModelPipelineCreator)
from wb.main.pipeline_creators.model_creation.configure_model_pipeline_creator import SHAPE_CONFIG_TYPE, \
    LAYOUT_CONFIG_TYPE
from wb.main.pipeline_creators.tokenizer.upload_tokenizer_pipeline_creator import UploadTokenizerPipelineCreator
from wb.main.utils.tokenizer.tokeinzer_wrapper import TokenizerWrapper
from wb.main.utils.safe_runner import safe_run
from wb.main.utils.utils import create_empty_dir, FileSizeConverter


@V1_MODELS_API.route('/models/all', methods=['GET'])
@safe_run
def get_all_models():
    """
    Return original IRs.

    Returns a list of objects, representing original IR models.
    A model is returned, if its status is "running" or "ready",
    or if it failed in Model Optimizer.

    Used by the frontend to fill the models table on the wizard page.
    """

    models = (
        TopologiesModel
            .query
            .filter(
            and_(
                TopologiesModel.status.notin_([StatusEnum.queued, StatusEnum.cancelled]),
                TopologiesModel.framework == SupportedFrameworksEnum.openvino,
            ),
        )
            .filter(
            TopologiesModel.optimized_from.is_(None)
        )
            .filter(
            not_(
                and_(
                    TopologiesModel.downloaded_from.isnot(None),
                    TopologiesModel.status == StatusEnum.error
                )
            )
        )
    )
    result = []
    for model in models:
        model_dict = model.short_json()
        fill_model_job_details(model, model_dict)
        result.append(model_dict)
    return jsonify(result)


@V1_MODELS_API.route('/model/<int:model_id>', methods=['GET'])
@safe_run
def model_info(model_id: int):
    model = TopologiesModel.query.get(model_id)
    if not model:
        raise NotFoundRequestError(f'Model with id {model_id} was not found on database')

    model_dict = model.json()
    fill_model_job_details(model, model_dict)
    return jsonify(model_dict)


@V1_MODELS_API.route('/xml-model/<int:model_id>', methods=['GET'])
@safe_run
def xml_model(model_id: int):
    model = TopologiesModel.query.get(model_id)
    if not model:
        raise NotFoundRequestError(f'Model with id {model_id} was not found on database')

    return jsonify({
        'xmlContent': model.get_xml_content() if model.framework == SupportedFrameworksEnum.openvino else ''
    })


@V1_MODELS_API.route('/model/<int:model_id>', methods=['PUT'])
@safe_run
def set_model_advanced_configuration(model_id: int):
    config = request.get_json()

    try_load_configuration(config)

    model = TopologiesModel.query.get(model_id)
    if not model:
        raise NotFoundRequestError(f'Model with id {model_id} was not found in the database')

    model.meta.task_type = config['taskType']
    model.meta.topology_type = config['taskMethod']
    model.meta.advanced_configuration = json.dumps(config)
    model.write_record(get_db_session_for_app())

    return jsonify(model.short_json())


@V1_MODELS_API.route('/model-upload', methods=['POST'])
@safe_run
def upload_model():
    data = request.get_json()

    model_name = data['modelName']
    files = data['files']

    framework = SupportedFrameworksEnum(data['framework'])
    if TF2FilesKeysEnum.keras.value in files.keys():
        framework = SupportedFrameworksEnum.tf2_keras
    if TF2FilesKeysEnum.saved_model_dir.value in files.keys():
        framework = SupportedFrameworksEnum.tf2

    if framework == SupportedFrameworksEnum.tf2:
        topology_size = FileSizeConverter.bytes_to_mb(files.get(TF2FilesKeysEnum.saved_model_dir.value)['size'])
    else:
        flat_files = reduce(
            lambda acc, item: acc + item if isinstance(item, list) else [*acc, item], files.values(),
            []
        )
        topology_size = FileSizeConverter.bytes_to_mb(sum(file['size'] for file in flat_files))
    if not TopologiesModel.is_size_valid(topology_size):
        return 'Model exceeds maximum acceptable size', 413

    metadata = TopologiesMetaDataModel()
    metadata.write_record(get_db_session_for_app())

    topology = TopologiesModel(model_name, framework, metadata.id)
    topology.source = ModelSourceEnum.ir if framework == SupportedFrameworksEnum.openvino else ModelSourceEnum.original
    topology.domain = ModelDomainEnum(data['domain'])
    topology.write_record(get_db_session_for_app())
    topology.path = os.path.join(UPLOAD_FOLDER_MODELS, str(topology.id), ORIGINAL_FOLDER)
    topology.write_record(get_db_session_for_app())

    if framework == SupportedFrameworksEnum.tf2:
        files_ids = create_files_for_tf2_saved_model_dir(files[TF2FilesKeysEnum.saved_model_dir.value],
                                                         topology.id, topology.path)
    else:
        checkpoint_files = files.get('checkpoint')
        files.pop('checkpoint', None)
        files_ids: Dict[str, Union[int, List[int]]] = FilesModel.create_files(files, topology.id, topology.path)

        if checkpoint_files:
            checkpoint_folder = os.path.join(topology.path, 'checkpoint')
            checkpoint_ids = [FilesModel.create_file(file, topology.id, checkpoint_folder) for file in checkpoint_files]
            files_ids['checkpoint'] = checkpoint_ids

    topology.size = topology_size
    topology.write_record(get_db_session_for_app())
    result = {'modelItem': topology.short_json(), 'files': files_ids}
    create_empty_dir(topology.path)
    if framework != SupportedFrameworksEnum.openvino:
        if framework == SupportedFrameworksEnum.tf2_keras:
            pipeline_creator = UploadKerasModelPipelineCreator(topology.id, topology.name, metadata.id, framework)
        else:
            pipeline_creator = UploadOriginalModelPipelineCreator(topology.id, topology.name, metadata.id, framework)
        pipeline_creator.create()
        result['modelItem'] = pipeline_creator.converted_model.short_json()
        result['modelItem']['modelOptimizerJobId'] = pipeline_creator.model_optimizer_job_id

        manifest = ManifestFactory.create_topology_specific(topology)
        ManifestDumper.dump_to_yaml(manifest)
        topology.manifest_path = str(manifest.path)
        topology.write_record(get_db_session_for_app())

    else:
        pipeline_creator = UploadIRModelPipelineCreator(topology.id)
        pipeline_creator.create()
        result['modelItem']['originalModelFramework'] = framework.value

    pipeline_creator.run_pipeline()
    return jsonify(result)


@V1_MODELS_API.route('/model-upload/<int:file_id>', methods=['POST'])
@safe_run
def write_model(file_id: int):
    file_record = FilesModel.query.get(file_id)
    if not file_record:
        return 'File record with id {} was not found on the database'.format(file_id), 404
    res = on_new_chunk_received(request, file_id)
    return jsonify(res)


@V1_MODELS_API.route('/model/<int:model_id>', methods=['DELETE'])
@safe_run
def delete_model(model_id: int):
    delete_model_from_db(model_id)
    return jsonify({'id': model_id})


@V1_MODELS_API.route('/model/<int:model_id>/shapes', methods=['GET'])
@safe_run
def get_model_shapes(model_id: int):
    model = TopologiesModel.query.get(model_id)
    if not model:
        raise NotFoundRequestError(f'Model with id {model_id} was not found on database')
    shapes = [shape.json() for shape in model.shapes if shape.status == StatusEnum.ready]
    return jsonify(shapes)


@V1_MODELS_API.route('/model/<int:model_id>/tokenizers', methods=['POST'])
@safe_run
def post_tokenizer(model_id: int):
    data = request.get_json()

    model: TopologiesModel = TopologiesModel.query.get(model_id)
    if not model:
        raise NotFoundRequestError(f'Model with id {model_id} was not found on database')

    tokenizer_size = FileSizeConverter.bytes_to_mb(
        sum([data['vocabFile']['size'], data.get('mergesFile', {}).get('size', 0)])
    )

    if tokenizer_size > AcceptableFileSizesMb.TOKENIZER.value:
        return 'Tokenizer exceeds maximum acceptable size', 413

    tokenizer = TokenizerModel(name=data['name'], tokenizer_type=TokenizerTypeEnum(data['type']))
    tokenizer.write_record(get_db_session_for_app())
    tokenizer.path = os.path.join(UPLOAD_FOLDER_TOKENIZERS / str(tokenizer.id))

    files = {
        'vocabFile': data['vocabFile']
    }
    files['vocabFile']['name'] = TokenizerWrapper.tokenizer_files_map[tokenizer.tokenizer_type]['vocabFile']

    if tokenizer.tokenizer_type == TokenizerTypeEnum.BPE:
        files['mergesFile'] = data['mergesFile']
        files['mergesFile']['name'] = TokenizerWrapper.tokenizer_files_map[tokenizer.tokenizer_type]['mergesFile']

    files_ids_map: Dict[str, int] = FilesModel.create_files(files, tokenizer.id, tokenizer.path)
    tokenizer.size = sum([f.size for f in tokenizer.files])
    tokenizer.write_record(get_db_session_for_app())

    # bind to model
    TokenizerToTopologyModel(
        tokenizer_id=tokenizer.id,
        topology_id=model.id
    ).write_record(get_db_session_for_app())

    creator = UploadTokenizerPipelineCreator(tokenizer.id, model_id)
    creator.create()
    creator.run_pipeline()
    return jsonify({
        'tokenizer': tokenizer.json(),
        'fileIds': files_ids_map,
    })


@V1_MODELS_API.route('/file/upload/<int:file_id>', methods=['POST'])
@safe_run
def upload_file(file_id: int):
    file_record = FilesModel.query.get(file_id)
    if not file_record:
        raise NotFoundRequestError('File not found')
    try:
        res = on_new_chunk_received(request, file_id)
    except Exception as error:
        file_record.status = StatusEnum.error
        file_record.error_message = str(error)
        file_record.write_record(get_db_session_for_app())
        artifact: ArtifactsModel = file_record.artifact
        artifact.status = StatusEnum.error
        artifact.error_message = str(error)
        artifact.write_record(get_db_session_for_app())
        raise InternalServerRequestError(error)
    return jsonify(res)


@V1_MODELS_API.route('/model/<int:model_id>/tokenizers', methods=['GET'])
@safe_run
def get_tokenizers(model_id: int):
    model: TopologiesModel = TopologiesModel.query.get(model_id)
    if not model:
        raise NotFoundRequestError(f'Model with id {model_id} was not found on database')

    return jsonify([t.json() for t in model.tokenizers])


@V1_MODELS_API.route('/model/<int:unused_model_id>/tokenizers/<int:tokenizer_id>', methods=['GET'])
@safe_run
def get_tokenizer(unused_model_id: int, tokenizer_id: int):
    tokenizer: TokenizerModel = TokenizerModel.query.get(tokenizer_id)

    if not tokenizer:
        raise NotFoundRequestError(f'Tokenizer with id {tokenizer_id} was not found on database')

    return jsonify(tokenizer.json())


@V1_MODELS_API.route('/model/<int:unused_model_id>/tokenizers/<int:tokenizer_id>', methods=['DELETE'])
@safe_run
def delete_tokenizer(unused_model_id: int, tokenizer_id: int):
    tokenizer: TokenizerModel = TokenizerModel.query.get(tokenizer_id)

    if not tokenizer:
        raise NotFoundRequestError(f'Tokenizer with id {tokenizer_id} was not found on database')

    tokenizer.delete_record(get_db_session_for_app())

    return jsonify(None)


@V1_MODELS_API.route('/model/<int:model_id>/tokenizers/<int:tokenizer_id>/select', methods=['POST'])
@safe_run
def select_tokenizer(model_id: int, tokenizer_id: int):
    tokenizer: TokenizerModel = TokenizerModel.query.get(tokenizer_id)

    if not tokenizer:
        raise NotFoundRequestError(f'Tokenizer with id {tokenizer_id} was not found on database')

    model: TopologiesModel = TopologiesModel.query.get(model_id)
    if not model:
        raise NotFoundRequestError(f'Model with id {model_id} was not found on database')

    if tokenizer.id not in [model_tokenizer.id for model_tokenizer in model.tokenizers]:
        raise BadRequestError('Tokenizer not found for model')

    for tokenizer_to_topology in model.tokenizers_to_topology:
        tokenizer_to_topology.selected = tokenizer_to_topology.tokenizer_id == tokenizer_id
        tokenizer_to_topology.write_record(get_db_session_for_app())

    return jsonify(None)


@V1_MODELS_API.route('/model/<int:model_id>/configure', methods=['POST'])
@safe_run
def apply_model_shapes(model_id: int):
    model = TopologiesModel.query.get(model_id)
    if not model:
        raise NotFoundRequestError(f'There is not topology with {model_id}')

    data = request.get_json()

    try:
        inputs_configuration = data['inputsConfigurations']
    except KeyError as e:
        raise BadRequestError(f'Request does not contain valid {e}')

    shape_configuration, layout_configuration = parse_input_configuration(inputs_configuration)

    existing_shapes: List[ModelShapeConfigurationModel] = model.shapes
    for shape in existing_shapes:
        if shape.shape_configuration == shape_configuration and shape.status == StatusEnum.ready:
            # If there is the same configuration exists we set shape_configuration as None
            # to skip reshape stages in pipeline
            shape_configuration = None

    pipeline_creator = ConfigureModelPipelineCreator(model_id,
                                                     shape_configuration=shape_configuration,
                                                     layout_configuration=layout_configuration,
                                                     save_model=True)
    pipeline_creator.create()
    pipeline_creator.run_pipeline()
    return jsonify(pipeline_creator.pipeline.json())


def parse_input_configuration(inputs_configuration: List[Dict]) -> Tuple[SHAPE_CONFIG_TYPE, LAYOUT_CONFIG_TYPE]:
    shape_configuration = []
    layout_configuration = []
    for input_configuration in inputs_configuration:
        if 'name' not in input_configuration:
            raise AssertionError(f'Input configuration does not contain name for input')
        input_name = input_configuration['name']
        if 'index' not in input_configuration:
            raise AssertionError(f'Input configuration does not contain index for {input_name} input')
        input_index: int = input_configuration['index']

        if 'shape' in input_configuration:
            shape: List[int] = input_configuration['shape']
            if not is_shape_valid(shape):
                raise AssertionError(f'Shape configuration is not valid for {input_name} input')
            shape_configuration.append(
                InputShapeConfiguration(
                    name=input_name,
                    index=input_index,
                    shape=shape
                )
            )

        if 'layout' in input_configuration:
            layout: List[str] = input_configuration['layout']
            if not is_layout_valid(layout):
                raise AssertionError(f'Layout configuration is not valid for {input_name} input')
            layout_configuration.append(
                InputLayoutConfiguration(
                    name=input_name,
                    index=input_index,
                    layout=layout
                )
            )
    return shape_configuration, layout_configuration


def is_shape_valid(shape: List[int]) -> bool:
    if not isinstance(shape, list):
        return False
    for dim in shape:
        if not isinstance(dim, int) or dim < -1:
            return False
    return True


def is_layout_valid(layout: List[str]) -> bool:
    for l_dim in layout:
        if not isinstance(l_dim, str):
            return False
        try:
            LayoutDimValuesEnum(l_dim)
        except ValueError:
            return False
    return True


def create_files_for_tf2_saved_model_dir(files: dict, artifact_id: int, artifact_path: str) -> dict:
    result = {}
    for file_data in files['assets']:
        path = os.path.join(artifact_path, 'assets', file_data['name'])
        result[file_data['name']] = FilesModel.create_file_record(file_data, artifact_id, path)
    for file_data in files['variables']:
        path = os.path.join(artifact_path, 'variables', file_data['name'])
        result[file_data['name']] = FilesModel.create_file_record(file_data, artifact_id, path)
    pb_model_file_data = files['pbModel']
    path = os.path.join(artifact_path, pb_model_file_data['name'])
    result[pb_model_file_data['name']] = FilesModel.create_file_record(pb_model_file_data, artifact_id, path)
    return result
