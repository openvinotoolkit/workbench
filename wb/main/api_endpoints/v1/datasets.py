"""
 OpenVINO DL Workbench
 Endpoints to work with datasets

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
import os
from pathlib import Path

from flask import jsonify, request, send_file
from sqlalchemy.sql.elements import and_

from config.constants import UPLOADS_FOLDER, UPLOAD_FOLDER_DATASETS
from wb.extensions_factories.database import get_db_session_for_app
from wb.main.api_endpoints.utils import delete_dataset_from_db, on_new_chunk_received
from wb.main.api_endpoints.v1 import V1_DATASETS_API
from wb.main.enumerates import StatusEnum
from wb.main.models.artifacts_model import TooLargePayloadException
from wb.main.models import DatasetsModel, FilesModel
from wb.main.pipeline_creators.dataset_creation.create_unannotated_dataset_pipeline_creator import \
    CreateUnannotatedDatasetPipelineCreator
from wb.main.pipeline_creators.dataset_creation.upload_dataset_pipeline_creator import \
    get_upload_dataset_pipeline_creator
from wb.main.shared.enumerates import DatasetTypesEnum
from wb.main.utils.safe_runner import safe_run


@V1_DATASETS_API.route('/datasets', methods=['GET'])
@safe_run
def datasets():
    available_datasets = DatasetsModel.query \
        .filter(
        and_(
            DatasetsModel.status.not_in(
                [StatusEnum.queued,
                 StatusEnum.cancelled,
                 StatusEnum.error]
            ),
            DatasetsModel.is_internal.is_(False),
        )
    ) \
        .all()
    return jsonify([dataset.json() for dataset in available_datasets])


@V1_DATASETS_API.route('/dataset/<dataset_id>', methods=['GET'])
@safe_run
def dataset_info(dataset_id):
    return jsonify(DatasetsModel.query.get(dataset_id).json())


@V1_DATASETS_API.route('/dataset-upload', methods=['POST'])
@safe_run
def create_dataset():
    data = request.get_json()
    files = data['files']
    dataset_name = data['datasetName']
    try:
        dataset_type = DatasetTypesEnum(data.get('datasetType'))
    except ValueError:
        dataset_type = None
    try:
        not_nlp = not dataset_type or not dataset_type.is_nlp()
        dataset = DatasetsModel.create_dataset(data['datasetName'], files, UPLOADS_FOLDER, dataset_type=dataset_type,
                                               is_internal=not_nlp)
    except TooLargePayloadException as exc:
        return str(exc), 413
    files_ids = FilesModel.create_files(files, dataset.id, dataset.path)
    pipeline_creator = get_upload_dataset_pipeline_creator(dataset.id, dataset_name, dataset_type, data)
    pipeline_creator.create()
    pipeline_creator.run_pipeline()
    if pipeline_creator.result_dataset:
        dataset = pipeline_creator.result_dataset
    return jsonify({'datasetItem': dataset.json(), 'files': files_ids, })


@V1_DATASETS_API.route('/dataset-upload/<int:file_id>', methods=['POST'])
@safe_run
def write_dataset(file_id: int):
    file_record = FilesModel.query.get(file_id)
    if not file_record:
        return 'Dataset with id {} was not found on the database'.format(file_id), 404
    res = on_new_chunk_received(request, file_id)
    return jsonify(res)


@V1_DATASETS_API.route('/dataset/<int:dataset_id>', methods=['DELETE'])
@safe_run
def delete_dataset(dataset_id: int):
    delete_dataset_from_db(dataset_id)
    return jsonify({'id': dataset_id})


@V1_DATASETS_API.route('/dataset/<int:dataset_id>/image/<path:image_name>', methods=['GET'])
@safe_run
def dataset_img(dataset_id: int, image_name: str):
    dataset = DatasetsModel.query.get(dataset_id)
    image_path = Path(dataset.get_dataset_img(image_name))
    return send_file(image_path, mimetype=f'image/{image_path.suffix.lower().strip(".")}')


@V1_DATASETS_API.route('/datasets/not-annotated', methods=['POST'])
@safe_run
def create_na_dataset():
    data = request.get_json()
    files = data['files']
    augmentation_config = data['augmentationConfig']
    try:
        dataset = DatasetsModel.create_dataset(data['datasetName'], files, UPLOAD_FOLDER_DATASETS,
                                               dataset_type=DatasetTypesEnum.not_annotated)
    except TooLargePayloadException as exc:
        return str(exc), 413
    dataset.dataset_type = DatasetTypesEnum.not_annotated
    dataset.number_images = len(files)
    dataset.write_record(get_db_session_for_app())
    for file_id, file_data in files.items():
        _, file_extension = os.path.splitext(file_data['name'])
        file_data['name'] = file_id + file_extension
    files_ids = FilesModel.create_files(files, dataset.id, dataset.path)
    pipeline_creator = CreateUnannotatedDatasetPipelineCreator(dataset.id, augmentation_config)
    pipeline_creator.create()
    pipeline_creator.run_pipeline()
    return jsonify({'datasetItem': dataset.json(), 'files': files_ids, })
