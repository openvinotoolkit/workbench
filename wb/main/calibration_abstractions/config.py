"""
 OpenVINO DL Workbench
 Class for calibration config

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
import json

from wb.main.calibration_abstractions.compression import Compression
from wb.main.calibration_abstractions.model import Model


class Config:
    """
    Abstraction for calibration config:
    {
    /* model */
    "model": Model specific parameters,
    "engine": accuracy config,
    "compression": Compression specific parameters,
    ...
    }
    """
    def __init__(self, model: Model,
                 engine: dict,
                 compression: Compression):
        self.model = model
        self.engine = engine
        self.compression = compression

    def json(self):
        return {
            'model': self.model.json(),
            'engine': self.engine,
            'compression': self.compression.json(),
        }

    def dump_to_json(self, path: str):
        with open(path, 'w') as file_descriptor:
            json.dump(self.json(), file_descriptor)
