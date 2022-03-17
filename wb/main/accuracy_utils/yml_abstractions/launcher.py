"""
 OpenVINO DL Workbench
 Accuracy checker's configuration field abstraction

 Copyright (c) 2019 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
