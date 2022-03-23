"""
 OpenVINO DL Workbench
 General Error class

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

from wb.error.code_registry import CodeRegistry


class GeneralError(Exception):
    code = CodeRegistry.get_general_error_code()

    def __init__(self, message='Internal Server Error', details=None):
        super().__init__(message)
        self.message = message
        self.details = details or {}

    @classmethod
    def get_error_code(cls):
        return cls.code

    def get_error_message(self):
        return self.message
