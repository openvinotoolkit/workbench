"""
 OpenVINO DL Workbench
 Class for storing default parameters of remote and local scripts

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
