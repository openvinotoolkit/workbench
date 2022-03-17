"""
 OpenVINO DL Workbench
 Classes and functions creating and working with instance of Flask SocketIO

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
from flask_socketio import SocketIO

from config.constants import SERVER_MODE
from wb.config.application import get_config


def get_socket_io_server() -> SocketIO:
    if not get_socket_io_server.SOCKET_IO:
        get_socket_io_server.SOCKET_IO = _create_socket_io_server()
    return get_socket_io_server.SOCKET_IO


get_socket_io_server.SOCKET_IO = None


def _create_socket_io_server() -> SocketIO:
    if SERVER_MODE == 'development':
        return SocketIO(cors_allowed_origins='*')
    return SocketIO()


def get_socket_io() -> SocketIO:
    return SocketIO(message_queue=get_config().broker_url)
