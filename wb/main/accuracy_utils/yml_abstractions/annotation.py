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


class Annotation:
    def __init__(self, **kwargs):
        self.annotation_conversion = {}
        for key, value in kwargs.items():
            self.annotation_conversion[key] = value

    def to_dict(self) -> dict:
        return {
            'annotation_conversion': self.annotation_conversion
        }

    @staticmethod
    def from_dict(data: dict) -> 'Annotation':
        return Annotation(**data)
