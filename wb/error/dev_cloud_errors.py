"""
 OpenVINO DL Workbench
 Error classes for DevCloud related jobs

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
from requests import Response

from wb.error.general_error import GeneralError
from wb.error.code_registry import CodeRegistry


class DevCloudGeneralError(GeneralError):
    code = CodeRegistry.get_dev_cloud_general_error_code()


class DevCloudNotRunningError(DevCloudGeneralError):
    code = CodeRegistry.get_dev_cloud_not_running_error_code()


class DevCloudHTTPError(DevCloudGeneralError):
    response: Response

    def __init__(self, message: str, response: Response):
        super().__init__(message)
        self.response = response


class DevCloudHandshakeHTTPError(DevCloudHTTPError):
    code = CodeRegistry.get_dev_cloud_handshake_error_code()


class DevCloudDevicesHTTPError(DevCloudHTTPError):
    code = CodeRegistry.get_dev_cloud_devices_error_code()


class DevCloudRemoteJobHTTPError(DevCloudHTTPError):
    code = CodeRegistry.get_dev_cloud_remote_job_error_code()


class DevCloudSocketError(DevCloudGeneralError):
    code = CodeRegistry.get_dev_cloud_remote_job_error_code()
