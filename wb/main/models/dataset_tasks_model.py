"""
 OpenVINO DL Workbench
 ORM model to store tasks supported by datasets.

 Copyright (c) 2018 Intel Corporation

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
