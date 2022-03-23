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
