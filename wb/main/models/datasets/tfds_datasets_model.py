"""
 OpenVINO DL Workbench
 Class for ORM model describing available TFDS datasets

 Copyright (c) 2022 Intel Corporation

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

from sqlalchemy import Column, Integer, Text, String

from wb.main.models.base_model import BaseModel
from wb.main.models.enumerates import DATASET_TYPES_ENUM_SCHEMA


class TFDSDatasetModel(BaseModel):
    __tablename__ = 'tfds_datasets'

    id = Column(Integer, primary_key=True, autoincrement=True)
    label = Column(String, nullable=False)
    name = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    default_format = Column(DATASET_TYPES_ENUM_SCHEMA, nullable=False)
    homepage = Column(String, nullable=True)
    version = Column(String, nullable=True)
    download_size = Column(Integer, nullable=True)
    num_classes = Column(Integer, nullable=True)
    subset_data = Column(String, nullable=True)

    def __init__(self, data: dict):
        self.label = data['label']
        self.name = data['name']
        self.description = data['description']
        self.default_format = data['default_format']
        self.homepage = data['homepage']
        self.version = data['version']
        self.download_size = data['download_size']
        self.num_classes = data['num_classes']
        self.subset_data = json.dumps(data['subset_data'])

    def json(self):
        return {
            'label': self.label,
            'name': self.name,
            'description': self.description,
            'default_format': self.default_format.value,
            'homepage': self.homepage,
            'version': self.version,
            'download_size': self.download_size,
            'num_classes': self.num_classes,
            'subset_data': json.loads(self.subset_data),
        }
