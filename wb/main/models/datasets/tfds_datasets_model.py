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
from typing import Optional

from sqlalchemy import Column, Integer, Text, String

from wb.main.models.base_model import BaseModel
from wb.main.models.enumerates import DATASET_TYPES_ENUM_SCHEMA
from wb.main.shared.enumerates import DatasetTypesEnum


class TFDSDatasetModel(BaseModel):
    __tablename__ = 'tfds_datasets'

    id = Column(Integer, primary_key=True, autoincrement=True)
    label = Column(String, nullable=False)
    name = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    default_format = Column(DATASET_TYPES_ENUM_SCHEMA, nullable=False)
    doc_url = Column(String, nullable=True)
    license_url = Column(String, nullable=True)
    subset_data = Column(String, nullable=True)

    def __init__(self, label: str, name: Optional[str], description: Optional[str],
                 default_format: DatasetTypesEnum, doc_url: Optional[str], license_url: Optional[list],
                 subset_data: dict):
        self.label = label
        self.name = name
        self.description = description
        self.default_format = default_format
        self.doc_url = doc_url
        self.license_url = license_url
        self.subset_data = str(subset_data)

    def json(self):
        return {
            'label': self.label,
            'name': self.name,
            'description': self.description,
            'default_format': self.default_format.value,
            'doc_url': self.doc_url,
            'license_url': self.license_url,
            'subset_data': json.loads(self.subset_data),
        }
