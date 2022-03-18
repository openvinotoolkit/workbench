"""
 OpenVINO DL Workbench
 Class for compression abstraction in the calibration config

 Copyright (c) 2018-2019 Intel Corporation

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
from wb.main.calibration_abstractions.algorithm import QuantizationAlgorithm


class Compression:
    """
    Abstraction for Compression section of calibration config:
    "compression": {
        "target_device": "CPU", // target device, the specificity of which will be taken into account during compression
        "algorithms": [
            QuantizationAlgorithm // value of QuantizationAlgorithm class (json)
        ]
    }
    """
    def __init__(self, target_device: str,
                 algorithm: QuantizationAlgorithm):
        self.target_device = target_device
        self.algorithm = algorithm

    def json(self) -> dict:
        return {
            'target_device': self.target_device,
            'algorithms': [self.algorithm.json(), ],
        }
