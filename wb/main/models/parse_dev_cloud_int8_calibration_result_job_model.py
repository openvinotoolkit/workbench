"""
 OpenVINO DL Workbench
 Class for ORM model describing job for parsing DevCloud profiling results

 Copyright (c) 2020 Intel Corporation

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
from wb.main.models.parse_dev_cloud_result_job_model import ParseDevCloudResultJobModel, ParseDevCloudResultJobData
from wb.main.models.topologies_model import TopologiesModel


class ParseDevCloudInt8CalibrationResultJobData(ParseDevCloudResultJobData):
    int8ModelId: int


class ParseDevCloudInt8CalibrationResultJobModel(ParseDevCloudResultJobModel):
    __tablename__ = 'parse_dev_cloud_int8_calibration_result_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.parse_dev_cloud_int8_calibration_result_job.value
    }

    job_id = Column(Integer, ForeignKey(ParseDevCloudResultJobModel.job_id), primary_key=True)
    int8_model_id = Column(Integer, ForeignKey(TopologiesModel.id), primary_key=True)

    int8_model = relationship(TopologiesModel, foreign_keys=[int8_model_id], uselist=False,
                              backref=backref('parse_dev_cloud_job_artifact', cascade='delete,all'))

    def __init__(self, data: ParseDevCloudInt8CalibrationResultJobData):
        super().__init__(data)
        self.int8_model_id = data['int8ModelId']
