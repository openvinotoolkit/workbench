"""
 OpenVINO DL Workbench
 Class for compression abstraction in the calibration config

 Copyright (c) 2018-2019 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
