"""
 OpenVINO DL Workbench
 Functions for getting devices hardware information from DevCloud service

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
import logging
from typing import List, Dict, Optional

from flask import Flask
from typing_extensions import TypedDict

from wb.config.application import get_config
from wb.error.dev_cloud_errors import DevCloudNotRunningError, DevCloudHandshakeHTTPError
from wb.extensions_factories.database import get_db_session_for_app
from wb.main.models.cpu_info_model import CPUInfoModel
from wb.main.models.dev_cloud_target_model import DevCloudTargetModel
from wb.main.enumerates import CPUPlatformTypeEnum, TargetOSEnum

from wb.main.models.wb_information_model import WBInfoModel
from wb.main.utils.dev_cloud_http_service import DevCloudHttpService, HandshakePayload
from wb.main.utils.device_info import load_available_hardware_info
from wb.utils.utils import set_dev_cloud_availability


def handshake_with_dev_cloud_service(app: Flask):
    set_dev_cloud_availability(state=False)
    if not DevCloudHttpService.is_url_set():
        return
    config = get_config()
    handshake_payload = HandshakePayload(wbURL=config.get_url_for_cloud())
    try:
        handshake_response = DevCloudHttpService.start_handshake(handshake_payload)
    except DevCloudNotRunningError:
        logging.warning('Unable to connect to DevCloud service - check if it is running')
        return
    except DevCloudHandshakeHTTPError as error:
        logging.warning('Handshake with DevCloud failed. Response: %s', error.response.text)
        return
    with app.app_context():
        wb_info: WBInfoModel = WBInfoModel.query.one()
        wb_info.dev_cloud_user = handshake_response['dcUser']
        wb_info.dev_cloud_file_system_prefix = handshake_response['dcFileSystemPrefix']
        wb_info.write_record(get_db_session_for_app())
        update_dev_cloud_devices()


def check_dev_cloud_service_with_devices() -> Optional[Dict]:
    try:
        devices_json = DevCloudHttpService.get_devices()
        set_dev_cloud_availability(state=True)
        return devices_json
    except DevCloudNotRunningError:
        set_dev_cloud_availability(state=False)


def update_dev_cloud_devices():
    devices_json = check_dev_cloud_service_with_devices()
    nodes_data = []
    if devices_json:
        nodes_data: List[DevCloudNodeDTO] = devices_json['data']
    for platform_info in nodes_data:
        save_node(platform_info)
    fetched_dev_cloud_node_names = [node['node_type'] for node in nodes_data]
    inactive_dev_cloud_nodes: List[DevCloudTargetModel] = DevCloudTargetModel.query.filter(
        DevCloudTargetModel.name.notin_(fetched_dev_cloud_node_names)).all()
    for inactive_node in inactive_dev_cloud_nodes:
        inactive_node.inactive = True
        inactive_node.write_record(get_db_session_for_app())


class DevCloudNodeDescriptionDTO(TypedDict):
    processor_name: str
    processor_number: str
    processor_type: str
    cpu_cores: int
    cpu_speed: str
    platform_memory: str
    operating_system: str


class DevCloudNodeDTO(TypedDict):
    node_devices: List[dict]
    node_type: str
    node_description: DevCloudNodeDescriptionDTO
    node_count: int
    node_tags: List[Dict[str, str]]


def save_node(node_info: DevCloudNodeDTO):
    node_name = node_info['node_type']
    node_description = node_info['node_description']
    inference_engine_devices = node_info['node_devices']
    if not inference_engine_devices or not isinstance(node_description, dict):
        return
    target: DevCloudTargetModel = DevCloudTargetModel.query.filter_by(name=node_name).first()
    if not target:
        platform_name = node_description['processor_type'].lower()
        operating_system = node_description.get('operating_system', TargetOSEnum.ubuntu18.value).lower()
        operating_system = TargetOSEnum(operating_system or TargetOSEnum.ubuntu18.value)
        cpu_info = CPUInfoModel(name=node_description['processor_name'],
                                platform_type=CPUPlatformTypeEnum(platform_name),
                                processor_family=node_description['processor_name'],
                                processor_number=node_description['processor_number'],
                                cores_number=int(node_description['cpu_cores']),
                                frequency=node_description['cpu_speed'])
        cpu_info.write_record(get_db_session_for_app())
        target = DevCloudTargetModel({
            'operatingSystem': operating_system,
            'host': node_name,
        })
        target.cpu_info_id = cpu_info.id
        target.write_record(get_db_session_for_app())
    elif target.inactive:
        target.inactive = False
        target.write_record(get_db_session_for_app())

    load_available_hardware_info(target_id=target.id,
                                 devices_info=inference_engine_devices,
                                 session=get_db_session_for_app())
