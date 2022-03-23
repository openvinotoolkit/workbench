"""
 OpenVINO DL Workbench
 SocketIO Event handlers

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
import logging as log

from flask_jwt_extended import verify_jwt_refresh_token_in_request, exceptions
from flask_socketio import disconnect

from wb.extensions_factories.socket_io import get_socket_io_server

SOCKET_IO = get_socket_io_server()


@SOCKET_IO.on('connect')
def handle_connect():
    try:
        verify_jwt_refresh_token_in_request()
    except exceptions.JWTExtendedException:
        log.debug('Socket connection authentication error')
        disconnect()
        return False
    return True
