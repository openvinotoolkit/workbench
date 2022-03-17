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
import yaml

from wb.main.accuracy_utils.yml_abstractions.dataset import Dataset
from wb.main.accuracy_utils.yml_abstractions.launcher import Launcher


class Model:
    def __init__(self, launcher: Launcher, dataset: Dataset, name: str = 'model'):
        self.name = name
        self.launcher = launcher
        self.dataset = dataset

    def to_dict(self) -> dict:
        return {
            'models': [
                {
                    'name': self.name,
                    'launchers': [
                        self.launcher.to_dict()
                    ],
                    'datasets': [
                        self.dataset.to_dict()
                    ]
                }
            ]
        }

    @staticmethod
    def from_dict(data: dict) -> 'Model':
        data = data['models'][0]
        required_fields = {'datasets', 'launchers'}
        if required_fields > set(data):
            raise KeyError('not all of the required fields ({}) are present in the dictionary'
                           .format(required_fields))
        dataset = Dataset.from_dict(data['datasets'][0])
        launcher = Launcher.from_dict(data['launchers'][0])
        return Model(launcher, dataset, data['name'])

    def dump_to_yml(self, path: str):
        with open(path, 'w+') as file:
            yaml.safe_dump(self.to_dict(), file)

    @staticmethod
    def from_yml(path: str):
        with open(path) as file:
            config = yaml.safe_load(file)
        return Model.from_dict(config)
