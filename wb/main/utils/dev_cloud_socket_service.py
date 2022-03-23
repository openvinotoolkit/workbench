"""
 OpenVINO DL Workbench
 Class for working with DevCloud Service Socket API

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
import logging
from enum import Enum
from typing import Optional, Callable

import socketio
from typing_extensions import TypedDict

from config.constants import CLOUD_SERVICE_HOST, CLOUD_SERVICE_PORT
from wb.error.dev_cloud_errors import DevCloudSocketError
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser


class DevCloudSocketEventsEnum(Enum):
    connect = 'connect'
    disconnect = 'disconnect'
    remote_job = 'remote-job'
    remote_job_success = f'{remote_job}-success'
    remote_job_failed = f'{remote_job}-failed'


class DevCloudSocketMessage(TypedDict):
    log: Optional[str]
    error: Optional[str]


class DevCloudSocketService:
    _socket_url = f'{CLOUD_SERVICE_HOST}:{CLOUD_SERVICE_PORT}'
    # Annotations
    _namespace: str
    _socket_data_parser: ConsoleToolOutputParser
    _remote_job_failed_callback: Optional[Callable[[DevCloudSocketMessage], None]]

    def __init__(self, socket_data_parser: ConsoleToolOutputParser, namespace: str):
        self._sio = socketio.Client()
        self._namespace = namespace
        self._socket_data_parser = socket_data_parser
        self._sio.on(DevCloudSocketEventsEnum.connect.value, self._connect_handler, namespace=self._namespace)
        self._sio.on(DevCloudSocketEventsEnum.disconnect.value, self._disconnect_handler, namespace=self._namespace)
        self._sio.on(DevCloudSocketEventsEnum.remote_job.value, self._handle_message, namespace=self._namespace)
        self._sio.on(DevCloudSocketEventsEnum.remote_job_success.value, self._handle_success_message,
                     namespace=self._namespace)
        self._sio.on(DevCloudSocketEventsEnum.remote_job_failed.value, self._handle_error_message,
                     namespace=self._namespace)

    def connect(self):
        self._sio.connect(DevCloudSocketService._socket_url, namespaces=[self._namespace])

    def wait(self):
        self._sio.wait()

    def disconnect_manually(self):
        logging.debug('[DevCloud Socket Service] Manually disconnected from %s', DevCloudSocketService._socket_url)
        self._sio.disconnect()

    def add_remote_job_failed_callback(self, callback: Callable[[DevCloudSocketMessage], None]):
        self._remote_job_failed_callback = callback

    @staticmethod
    def _connect_handler():
        logging.debug('[DevCloud Socket Service] Connected to the DevCloud service on %s',
                      DevCloudSocketService._socket_url)

    @staticmethod
    def _disconnect_handler():
        logging.debug('[DevCloud Socket Service] Disconnected from %s', DevCloudSocketService._socket_url)

    def _handle_message(self, socket_message: DevCloudSocketMessage):
        logging.debug('[DevCloud Socket Service] Received message %s', socket_message)
        self._socket_data_parser.parse(socket_message['log'])

    def _handle_success_message(self, unused_socket_message):
        logging.debug('[DevCloud Socket Service] Remote job has finished successfully')
        self._disconnect_handler()
        self._sio.disconnect()

    def _handle_error_message(self, socket_message: DevCloudSocketMessage):
        logging.debug('[DevCloud Socket Service] Remote job has failed. Payload: %s', socket_message)
        self._disconnect_handler()
        self._sio.disconnect()
        if self._remote_job_failed_callback:
            self._remote_job_failed_callback(socket_message)
        raise DevCloudSocketError(message=socket_message['error'])
