"""
 OpenVINO DL Workbench
 Class for model abstraction in the calibration config

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
from wb.main.models.topologies_model import TopologiesModel
from wb.main.utils.utils import find_by_ext


class Model:
    """
    Abstraction for "model" section of calibration config:
    "model": {
       "name": "model_name", // model name
       "model": "<MODEL_PATH>", // path to xml
       "weights": "<WIGHT_PATH>", // path to weight
    }
    """
    def __init__(self, topology_model: TopologiesModel):
        self.name = topology_model.name
        self.model = find_by_ext(topology_model.path, 'xml')
        self.weights = find_by_ext(topology_model.path, 'bin')

    def json(self) -> dict:
        return {
            'model_name': self.name,
            'model': self.model,
            'weights': self.weights,
        }
