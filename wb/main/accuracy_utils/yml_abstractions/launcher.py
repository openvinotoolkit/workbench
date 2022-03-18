"""
 OpenVINO DL Workbench
 Accuracy checker's configuration field abstraction

 Copyright (c) 2019 Intel Corporation

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
from wb.main.accuracy_utils.yml_abstractions.typed_parameter import Adapter

# pylint: disable=too-many-arguments
class Launcher:
    def __init__(self,
                 adapter: Adapter,
                 device: str,
                 model: str,
                 weights: str,
                 framework: str = 'openvino',
                 batch: int = 1,
                 inputs: list = None):
        self.framework = framework
        self.adapter = adapter
        self.device = device
        self.model = model
        self.weights = weights
        self.batch = batch
        self.inputs = inputs

    def to_dict(self) -> dict:
        data = {
            'framework': self.framework,
            'device': self.device,
            'adapter': self.adapter.to_dict(),
            'batch': self.batch,
        }
        if self.model:
            data['model'] = self.model
        if self.weights:
            data['weights'] = self.weights
        if self.inputs:
            data['inputs'] = self.inputs
        return data

    @staticmethod
    def from_dict(data: dict) -> 'Launcher':
        required_fields = {'adapter',
                           'framework',
                           'device',
                           'model',
                           'weights',
                           'batch',
                           }
        if required_fields > set(data):
            raise KeyError('Not all of the required fields ({}) are present in the dictionary'
                           .format(required_fields))
        adapter_obj = data['adapter']
        adapter_type = adapter_obj['type']
        adapter_obj.pop('type')
        data['adapter'] = Adapter(type=adapter_type, parameters=adapter_obj)
        return Launcher(**data)
