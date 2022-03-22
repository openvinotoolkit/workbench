"""
 OpenVINO DL Workbench
 Classes and functions creating and working with instance of Flask SocketIO

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
