"""
 OpenVINO DL Workbench
 Class for calibration config

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
