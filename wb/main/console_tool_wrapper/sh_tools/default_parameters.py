"""
 OpenVINO DL Workbench
 Class for storing default parameters of remote and local scripts

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
import os

from config.constants import TARGETS_FOLDER, OPENVINO_ROOT_PATH


class DefaultRemoteParameters:
    def __init__(self, bundle_path: str, artifact_name: str = None):
        self.output = os.path.join(bundle_path, artifact_name) if artifact_name else None
        self.openvino_package_root = bundle_path


class DefaultLocalParameters:
    def __init__(self, target_id: int, artifact_name: str):
        self.output = os.path.join(TARGETS_FOLDER, str(target_id), artifact_name)
        self.openvino_package_root = OPENVINO_ROOT_PATH
