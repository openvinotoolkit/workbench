"""
 OpenVINO DL Workbench
 Parse Env Vars Error class

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
from wb.error.general_error import GeneralError
from wb.error.code_registry import CodeRegistry


class ParseEnvError(GeneralError):
    code = CodeRegistry.get_parse_env_error_code()

    def __init__(self, env_var_name: str):
        message = 'Error while parsing env var "{}"'.format(env_var_name)
        super().__init__(message)
