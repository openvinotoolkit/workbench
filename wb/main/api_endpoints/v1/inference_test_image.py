"""
 OpenVINO DL Workbench
 Endpoints to work with test image inference

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
import json
import os

from flask import request, jsonify
from werkzeug.utils import secure_filename

from config.constants import UPLOADS_FOLDER
from wb.extensions_factories.database import get_db_session_for_app
from wb.main.accuracy_utils.accuracy_utils import is_visualization_config_valid
from wb.main.accuracy_utils.yml_templates.datasets_labels.labels import get_datasets_label_sets
from wb.main.api_endpoints.utils import save_artifact_chunk_upload
from wb.main.api_endpoints.v1 import V1_INFERENCE_TEST_IMAGE_API
from wb.main.enumerates import TargetTypeEnum, DeviceTypeEnum, TestInferVisualizationTypesEnum
from wb.main.models import (TopologiesModel, DevicesModel, TargetModel, LocalTargetModel, FilesModel,
                            InferenceTestImageModel)
from wb.main.pipeline_creators.inference_test_image_pipeline_creator import InferenceTestImagePipelineCreator
from wb.main.shared.enumerates import TaskEnum
from wb.main.utils.safe_runner import safe_run
from wb.main.utils.utils import FileSizeConverter, create_empty_dir


@V1_INFERENCE_TEST_IMAGE_API.route('/inference/test-images/upload', methods=['POST'])
@safe_run
def upload_test_image():
    file = request.get_json()['file']
    file['name'] = secure_filename(file['name'])
    image = InferenceTestImageModel(file['name'])
    image.write_record(get_db_session_for_app())
    image.path = os.path.join(UPLOADS_FOLDER, str(image.id))

    files_to_create = {file['name']: file}

    mask = None
    if 'mask' in request.get_json():
        mask = request.get_json()['mask']
        mask['name'] = secure_filename(mask['name'])
        files_to_create = {
            **files_to_create,
            mask['name']: mask
        }

    files_ids = FilesModel.create_files(files_to_create, image.id, image.path)
    image.size = FileSizeConverter.bytes_to_mb(sum([f.size for f in image.files]))
    image.write_record(get_db_session_for_app())
    create_empty_dir(image.path)

    result = {'imageId': image.id, 'fileId': files_ids[file['name']]}

    if mask:
        result = {**result, 'maskId': files_ids[mask['name']]}

    return jsonify(result)


@V1_INFERENCE_TEST_IMAGE_API.route('/inference/test-images/upload/<int:file_id>', methods=['POST'])
@safe_run
def upload_test_image_chunk(file_id: int):
    file_record = FilesModel.query.get(file_id)

    if not file_record:
        return 'File record with id {} was not found on the database'.format(file_id), 404
    save_artifact_chunk_upload(request, file_id)
    return jsonify({})


@V1_INFERENCE_TEST_IMAGE_API.route(
    '/inference/test-images/<int:image_id>/models/<int:model_id>/infer',
    methods=['POST']
)
@safe_run
def inference_model(image_id: int, model_id: int):
    topology: TopologiesModel = TopologiesModel.query.get(model_id)

    if not topology:
        return 'Model does not exist', 400

    request_data = request.get_json()

    # device id is optional, use local cpu if not provided
    device_id = request_data.get('deviceId')

    if device_id is not None:
        device: DevicesModel = DevicesModel.query.get(device_id)

        if not device:
            return 'Device does not exist', 400

        target: TargetModel = device.target

        if target.target_type != TargetTypeEnum.local:
            target: TargetModel = LocalTargetModel.query.first()
            device: DevicesModel = next(filter(lambda d: d.type == DeviceTypeEnum.CPU.value, target.devices))
    else:
        target: TargetModel = LocalTargetModel.query.first()
        device: DevicesModel = next(filter(lambda d: d.type == DeviceTypeEnum.CPU.value, target.devices))

    visualization_config = request_data.get('visualizationConfig')

    if visualization_config:
        if not is_visualization_config_valid(topology, device, visualization_config):
            return f'Invalid visualization config', 400

        topology.meta.visualization_configuration = json.dumps(visualization_config)
        topology.write_record(get_db_session_for_app())

    visualization_type = request_data.get('visualizationType')
    visualization_config = json.loads(topology.meta.visualization_configuration)
    task_type = TaskEnum(visualization_config.get('taskType'))

    if visualization_type == TestInferVisualizationTypesEnum.explain.value and task_type is not TaskEnum.classification:
        return 'Only classification usage supported for explanation', 400

    creator = InferenceTestImagePipelineCreator(
        target_id=target.id, topology_id=model_id, device_id=device.id, test_image_id=image_id,
        visualization_type=visualization_type
    )
    pipeline = creator.create()
    creator.run_pipeline()

    return jsonify(pipeline.json())


@V1_INFERENCE_TEST_IMAGE_API.route('/label-sets', methods=['GET'])
@safe_run
def get_label_sets():
    return jsonify(get_datasets_label_sets())
