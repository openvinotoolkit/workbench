"""
 OpenVINO DL Workbench
 Class for storing int8 calibration errors

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
from wb.main.console_tool_wrapper.error_message_processor import ErrorMessageProcessor


class ModelDownloaderErrorMessageProcessor(ErrorMessageProcessor):
    match_error = {
        'Caused by ProxyError Cannot connect to proxy': 'Network connection error. Check Internet connection. '
                                                        'If you are behind a corporate proxy, refer to documentation'
    }
