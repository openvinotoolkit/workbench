"""
 OpenVINO DL Workbench
 Functions for getting devices hardware information using IE python API

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

# pylint: disable=no-name-in-module
import logging
from pathlib import Path
from fcntl import flock, LOCK_EX, LOCK_NB
from openvino.runtime import Core
from sqlalchemy.orm import Session

from config.constants import SERVER_MODE
from wb.main.enumerates import DeviceTypeEnum
from wb.main.models import DevicesModel
from wb.main.scripts.get_inference_engine_devices import device_info
from wb.main.utils.utils import unify_precision_names


def load_available_hardware_info(target_id: int, devices_info: list = None, session: Session = None) -> list:
    if not devices_info:
        devices_info = get_ie_devices_info()
    devices = save_available_devices(target_id, devices_info, session)
    return [device.json() for device in devices]


def is_hddldaemon_running() -> bool:
    hddl_service_alive_mutex_path = Path('/var/tmp/hddl_service_alive.mutex')  # nosec: hardcoded_tmp_directory
    if not hddl_service_alive_mutex_path.is_file():
        return False
    with hddl_service_alive_mutex_path.open() as hddl_service_alive_mutex:
        try:
            # If the file can be locked - hddldaemon is not running
            flock(hddl_service_alive_mutex, LOCK_EX | LOCK_NB)
        except BlockingIOError:
            return True
    # Out of the `with` scope the file is unlocked automatically
    return False


def get_ie_devices_info() -> list:
    devices = []
    ie_core = Core()
    # pylint: disable=not-an-iterable
    for device in ie_core.available_devices:
        if not DeviceTypeEnum.is_supported(device):
            continue
        # We need to check is hddldaemon running for the HDDL device before any calls to the device
        # If we do some call to the device without running hddldaemon it will break the server
        if DeviceTypeEnum.is_hddl(device) and not is_hddldaemon_running() and SERVER_MODE != 'development':
            logging.warning('The hddldaemon is not running. '
                            'To use the HDDL device, please run the hddldaemon on the host')
            continue
        devices.append(device_info(ie_core, device))
    return devices


def save_available_devices(target_id: int, devices_info: list, session: Session) -> list:
    previously_active_devices = session.query(DevicesModel).filter_by(active=True, target_id=target_id).all()
    currently_active_devices = []
    for info in devices_info:
        device = info['DEVICE']
        if not DeviceTypeEnum.is_supported(device):
            continue
        if DeviceTypeEnum.is_vpu(device):
            info['OPTIMIZATION_CAPABILITIES'].append('FP32')
        
        common_optimization_capabilities = ('I16', 'I32', 'I64', 'U64')
        info['OPTIMIZATION_CAPABILITIES'].extend(common_optimization_capabilities)

        if 'OPTIMIZATION_CAPABILITIES' in info:
            info['OPTIMIZATION_CAPABILITIES'] = unify_precision_names(info['OPTIMIZATION_CAPABILITIES'])

        device_record = session.query(DevicesModel).filter_by(device_name=device, target_id=target_id).first()

        if device_record:
            device_record.active = True
        else:
            device_record = DevicesModel(
                target_id=target_id,
                device_type=DeviceTypeEnum.get_device(device),
                product_name=info['FULL_DEVICE_NAME'],
                device_name=device,
                optimization_capabilities=info['OPTIMIZATION_CAPABILITIES'],
                range_infer_requests=info['RANGE_FOR_ASYNC_INFER_REQUESTS'],
                range_streams=info.get('RANGE_FOR_STREAMS')
            )
            device_record.write_record(session)
        currently_active_devices.append(device_record)

    inactive_devices = set(previously_active_devices) - set(currently_active_devices)

    for inactive_device in inactive_devices:
        inactive_device.active = False
        inactive_device.write_record(session)

    return session.query(DevicesModel).filter_by(target_id=target_id).all()
