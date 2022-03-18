"""
 OpenVINO DL Workbench
 Class for model abstraction in the calibration config

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
