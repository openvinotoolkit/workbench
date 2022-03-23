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
from typing import Iterable


# pylint: disable=redefined-builtin
class TypedParameter:
    def __init__(self, type: str, parameters: dict):
        self.type = type
        self.parameters = parameters

    def to_dict(self) -> dict:
        type_dict = {'type': self.type}
        for key, value in self.parameters.items():
            type_dict[key] = value
        return type_dict

    @classmethod
    def from_list(cls, arg: Iterable[dict]):
        return [
            cls(
                type=obj['type'],
                parameters={
                    k: v
                    for k, v in obj.items()
                    if k != 'type'
                }
            )
            for obj in arg
        ]


class Preprocessing(TypedParameter):
    pass


class Postprocessing(TypedParameter):
    pass


class DataReader(TypedParameter):
    @classmethod
    def from_dict(cls, params: dict):
        reader_type = params.pop('type')
        return DataReader(reader_type, params)


class Metric(TypedParameter):
    @classmethod
    def from_list(cls, arg: Iterable[dict]):
        for obj in arg:
            obj['presenter'] = 'print_vector'
        return super().from_list(arg)


class Adapter(TypedParameter):
    def set_params(self, params: Iterable[dict]):
        self.parameters.update(params)
