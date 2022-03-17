"""
 OpenVINO DL Workbench
 Endpoints to work with remote hosts

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
from typing import List, Union, Tuple, Optional

from flask import jsonify, request, Response

from config.constants import CLOUD_SERVICE_URL
from wb.error.entry_point_error import InconsistentConfigError
from wb.error.ssh_client_error import SshAuthKeyContentError, SshAuthKeyNameError
from wb.extensions_factories.database import get_db_session_for_app
from wb.main.api_endpoints.v1 import V1_REMOTE_TARGETS_API
from wb.main.enumerates import TargetTypeEnum
from wb.main.models.local_target_model import LocalTargetModel
from wb.main.models.remote_target_model import RemoteTargetModel
from wb.main.models.system_resources_model import SystemResourcesModel
from wb.main.models.target_model import TargetModel
from wb.main.pipeline_creators.ping_pipeline_creator import PingPipelineCreator
from wb.main.pipeline_creators.setup_pipeline_creator import SetupPipelineCreator
from wb.main.utils.dev_cloud_platforms import update_dev_cloud_devices
from wb.main.utils.device_info import load_available_hardware_info
from wb.main.utils.safe_runner import safe_run
from wb.main.utils.utils import save_private_key, FileSizeConverter, check_ssh_key_validity
from wb.utils.utils import is_dev_cloud_available


@V1_REMOTE_TARGETS_API.route('/remote-targets', methods=['POST'])
@safe_run
def add_remote_target():
    if CLOUD_SERVICE_URL:
        return get_dev_cloud_mode_action_forbidden_response(action_name='Adding')
    data = request.get_json()
    ssh_key_size = FileSizeConverter.bytes_to_mb(len(data['privateKey'].encode('utf-8')))
    if not RemoteTargetModel.is_key_size_valid(ssh_key_size):
        return 'Key exceeds maximum acceptable size', 413
    try:
        remote_target = RemoteTargetModel(data)
        remote_target.create_proxies(data, get_db_session_for_app())
    except KeyError as error:
        raise InconsistentConfigError(f'The request does not contain field "{str(error)}"')
    system_resources = SystemResourcesModel()
    system_resources.write_record(get_db_session_for_app())
    remote_target.system_resources_id = system_resources.id

    error_response = validate_target_ssh_key(remote_target=remote_target, key_content=data['privateKey'],
                                             key_name=data['privateKeyFileName'])
    if error_response:
        return error_response

    remote_target.private_key_path = save_private_key(remote_target.id, data['privateKey'],
                                                      data['privateKeyFileName'])
    remote_target.write_record(get_db_session_for_app())
    setup_pipeline_creator = SetupPipelineCreator(remote_target.id)
    setup_pipeline_creator.create()
    setup_pipeline_creator.run_pipeline()
    return jsonify(remote_target.json())


@V1_REMOTE_TARGETS_API.route('/remote-targets', methods=['GET'])
@safe_run
def get_all_targets():
    local_target: TargetModel = TargetModel.query.filter_by(target_type=TargetTypeEnum.local).first()
    # Update devices for local target
    load_available_hardware_info(local_target.id, session=get_db_session_for_app())
    # Update DevCloud platforms and devices
    if is_dev_cloud_available():
        update_dev_cloud_devices()
    # Filter out local target for DevCloud mode
    if CLOUD_SERVICE_URL:
        targets: List[TargetModel] = TargetModel.query.filter(TargetModel.id != local_target.id).all()
    else:
        targets: List[TargetModel] = TargetModel.query.all()
    return jsonify([target.json() for target in targets])


@V1_REMOTE_TARGETS_API.route('/remote-targets/<int:target_id>', methods=['GET'])
@safe_run
def get_remote_target(target_id: int):
    target: Union[LocalTargetModel, RemoteTargetModel] = TargetModel.query.get(target_id)
    if not target:
        return get_target_404_response(target_id)
    return jsonify(target.json())


@V1_REMOTE_TARGETS_API.route('/remote-targets/<int:target_id>', methods=['PUT'])
@safe_run
def update_remote_target(target_id: int):
    if CLOUD_SERVICE_URL:
        return get_dev_cloud_mode_action_forbidden_response(action_name='Updating')
    target: RemoteTargetModel = RemoteTargetModel.query.get(target_id)
    if not target:
        return get_target_404_response(target_id)
    data: dict = request.get_json()

    ssh_key_content = data.get('privateKey')
    ssh_key_name = data.get('privateKeyFileName')
    if ssh_key_content and ssh_key_name:
        error_response = validate_target_ssh_key(remote_target=target, key_content=ssh_key_content,
                                                 key_name=ssh_key_name)
        if error_response:
            return error_response

    target.update_and_write(data, get_db_session_for_app())
    should_rerun_setup_pipeline = not bool(len(data) <= 1 and data.get('name'))
    if should_rerun_setup_pipeline:
        setup_pipeline_creator = SetupPipelineCreator(target_id)
        setup_pipeline_creator.create()
        setup_pipeline_creator.run_pipeline()
    return jsonify(target.json())


@V1_REMOTE_TARGETS_API.route('/remote-targets/<int:target_id>', methods=['DELETE'])
@safe_run
def delete_remote_target(target_id: int):
    if CLOUD_SERVICE_URL:
        return get_dev_cloud_mode_action_forbidden_response(action_name='Removing')
    target = RemoteTargetModel.query.get(target_id)
    if not target:
        return get_target_404_response(target_id)
    target.delete_record(get_db_session_for_app())
    return jsonify({'targetId': target_id})


@V1_REMOTE_TARGETS_API.route('/remote-targets/<int:target_id>/ping', methods=['GET'])
@safe_run
def ping_remote_target(target_id: int):
    if CLOUD_SERVICE_URL:
        return get_dev_cloud_mode_action_forbidden_response(action_name='Ping')
    target = TargetModel.query.get(target_id)
    if not target:
        return get_target_404_response(target_id)
    ping_pipeline_creator = PingPipelineCreator(target_id)
    ping_pipeline_creator.create()
    ping_pipeline_creator.run_pipeline()
    return jsonify(target.json())


@V1_REMOTE_TARGETS_API.route('/remote-targets/<int:target_id>/pipelines', methods=['GET'])
@safe_run
def get_pipelines_for_remote_target(target_id: int):
    target: TargetModel = TargetModel.query.get(target_id)
    if not target:
        return get_target_404_response(target_id)
    result = [pipeline.json() for pipeline in target.latest_pipelines]
    return jsonify(result)


def get_target_404_response(target_id: int) -> Tuple[str, int]:
    return f'Cannot find target with this id {target_id}', 404


def get_dev_cloud_mode_action_forbidden_response(action_name: str) -> Tuple[str, int]:
    return f'{action_name} of remote target is forbidden in DevCloud', 403


def validate_target_ssh_key(remote_target: RemoteTargetModel, key_content: str, key_name: str) -> \
        Optional[Tuple[Response, int]]:
    try:
        check_ssh_key_validity(key_content=key_content, key_name=key_name)
        return None
    except (SshAuthKeyContentError, SshAuthKeyNameError) as exception:
        remote_target.error = str(exception)
        remote_target.write_record(get_db_session_for_app())
        return jsonify({'error': str(exception), 'targetId': remote_target.id}), 400
