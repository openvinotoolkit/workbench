"""
 OpenVINO DL Workbench
 Class for ORM model describing job for parsing DevCloud per tensor distance calculation results

 Copyright (c) 2021 Intel Corporation

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

from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.datasets_model import DatasetsModel
from wb.main.models.parse_dev_cloud_result_job_model import ParseDevCloudResultJobModel, ParseDevCloudResultJobData


class ParseDevCloudPerTensorResultJobModel(ParseDevCloudResultJobModel):
    __tablename__ = 'parse_dev_cloud_per_tensor_result_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.parse_dev_cloud_per_tensor_result_job.value
    }

    job_id = Column(Integer, ForeignKey(ParseDevCloudResultJobModel.job_id), primary_key=True)

    def __init__(self, data: ParseDevCloudResultJobData):
        super().__init__(data)

