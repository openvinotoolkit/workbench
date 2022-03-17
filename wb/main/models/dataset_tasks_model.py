"""
 OpenVINO DL Workbench
 ORM model to store tasks supported by datasets.

 Copyright (c) 2018 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
from sqlalchemy import Integer, Column, ForeignKey

from wb.main.models.base_model import BaseModel
from wb.main.models.datasets_model import DatasetsModel
from wb.main.models.enumerates import TASK_ENUM_SCHEMA
from wb.main.shared.enumerates import TaskEnum


class DatasetTasksModel(BaseModel):
    __tablename__ = 'dataset_tasks'

    id = Column(Integer, primary_key=True)
    dataset_id = Column(Integer, ForeignKey('datasets.id'), nullable=False)
    task_type = Column(TASK_ENUM_SCHEMA, nullable=False)

    def __init__(self, dataset: DatasetsModel, task_type: TaskEnum):
        self.dataset_id = dataset.id
        self.task_type = task_type
