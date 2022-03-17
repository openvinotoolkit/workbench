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
