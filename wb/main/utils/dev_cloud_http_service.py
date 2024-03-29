"""
 OpenVINO DL Workbench
 Class for working with DevCloud Service HTTP API

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
import enum

import requests
from typing_extensions import TypedDict

from config.constants import CLOUD_SERVICE_HOST, CLOUD_SERVICE_PORT, REQUEST_TIMEOUT_SECONDS, CLOUD_SERVICE_API_PREFIX
from wb.error.dev_cloud_errors import (DevCloudNotRunningError, DevCloudHandshakeHTTPError, DevCloudDevicesHTTPError,
                                       DevCloudRemoteJobHTTPError)


class DevCloudApiEndpointsEnum(enum.Enum):
    sync = 'sync'
    devices = 'devices'
    remote_job = 'remote-job'  # old way with sharing artifacts via HTTP
    remote_job_trigger = 'remote-job/trigger'  # old way with sharing artifacts via shared folder


class HandshakePayload(TypedDict):
    wbURL: str


class HandshakeResponse(TypedDict):
    dcUser: str
    dcFileSystemPrefix: str


class TriggerRemoteJobPayload(TypedDict):
    platformTag: str
    wbPipelineId: int
    remoteJobType: str


class TriggerSharedFolderRemoteJobPayload(TriggerRemoteJobPayload):
    wbSetupBundlePath: str
    wbJobBundlePath: str


class TriggerNetworkRemotePipelinePayload(TriggerRemoteJobPayload):
    wbSetupBundleId: int
    wbJobBundleId: int


class RemoteJobStatusResponse(TypedDict):
    wbPipelineId: int
    status: str


class DevCloudHttpService:
    _api_url = f'{CLOUD_SERVICE_HOST}:{CLOUD_SERVICE_PORT}/{CLOUD_SERVICE_API_PREFIX}'

    @staticmethod
    def is_url_set() -> bool:
        return CLOUD_SERVICE_HOST and CLOUD_SERVICE_PORT

    @staticmethod
    def start_handshake(payload: HandshakePayload) -> HandshakeResponse:
        url = f'{DevCloudHttpService._api_url}/{DevCloudApiEndpointsEnum.sync.value}'
        try:
            response = requests.post(url=url, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)
        except requests.exceptions.ConnectionError:
            raise DevCloudNotRunningError('DevCloud service is not running')
        if response.status_code != requests.codes['ok']:
            raise DevCloudHandshakeHTTPError('Handshake with DevCloud failed', response=response)
        return response.json()

    @staticmethod
    def get_devices() -> dict:
        url = f'{DevCloudHttpService._api_url}/{DevCloudApiEndpointsEnum.devices.value}'
        try:
            response = requests.get(url=url, timeout=REQUEST_TIMEOUT_SECONDS)
        except requests.exceptions.ConnectionError:
            raise DevCloudNotRunningError('DevCloud service is not running')
        if response.status_code != requests.codes['ok']:
            raise DevCloudDevicesHTTPError('Unable to fetch DevCloud devices', response=response)
        return response.json()

    @staticmethod
    def trigger_network_remote_pipeline(payload: TriggerRemoteJobPayload) -> dict:
        url = f'{DevCloudHttpService._api_url}/{DevCloudApiEndpointsEnum.remote_job.value}'
        return DevCloudHttpService._trigger_remote_job(url, payload)

    @staticmethod
    def trigger_shared_folder_remote_pipeline(payload: TriggerRemoteJobPayload) -> dict:
        url = f'{DevCloudHttpService._api_url}/{DevCloudApiEndpointsEnum.remote_job_trigger.value}'
        return DevCloudHttpService._trigger_remote_job(url, payload)

    @staticmethod
    def _trigger_remote_job(url: str, payload: TriggerRemoteJobPayload):
        response = requests.post(url=url, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)
        if response.status_code != requests.codes['ok']:
            raise DevCloudRemoteJobHTTPError('Unable to trigger DevCloud remote job', response=response)
        return response.json()

    @staticmethod
    def get_remote_job_status(wb_pipeline_id: int) -> RemoteJobStatusResponse:
        url = f'{DevCloudHttpService._api_url}/{DevCloudApiEndpointsEnum.remote_job.value}/{wb_pipeline_id}'
        response = requests.get(url=url, timeout=REQUEST_TIMEOUT_SECONDS)
        if response.status_code != requests.codes['ok']:
            raise DevCloudRemoteJobHTTPError('Unable to get DevCloud remote job status', response=response)
        return response.json()

    @staticmethod
    def cancel_remote_job(wb_pipeline_id: int) -> RemoteJobStatusResponse:
        url = f'{DevCloudHttpService._api_url}/{DevCloudApiEndpointsEnum.remote_job.value}/{wb_pipeline_id}'
        response = requests.delete(url=url, timeout=REQUEST_TIMEOUT_SECONDS)
        if response.status_code != requests.codes['ok']:
            raise DevCloudRemoteJobHTTPError('Unable to cancel DevCloud remote job', response=response)
        return response.json()
