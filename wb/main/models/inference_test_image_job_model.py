"""
 OpenVINO DL Workbench
 InferenceTestImageJobModel

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

from wb.main.enumerates import JobTypesEnum, TestInferVisualizationTypesEnum
from wb.main.models import DevicesModel
from wb.main.models.enumerates import TEST_INFER_VISUALIZATION_TYPES_ENUM_SCHEMA
from wb.main.models.inference_test_image_model import InferenceTestImageModel
from wb.main.models.jobs_model import JobsModel


class InferenceTestImageJobModel(JobsModel):
    __tablename__ = 'inference_test_image_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.inference_test_image_job.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)

    topology_id = Column(Integer, ForeignKey('topologies.id'))

    device_id = Column(Integer, ForeignKey(DevicesModel.id))

    test_image_id = Column(Integer, ForeignKey(InferenceTestImageModel.id))

    visualization_type: TestInferVisualizationTypesEnum = Column(TEST_INFER_VISUALIZATION_TYPES_ENUM_SCHEMA,
                                                                 nullable=False,
                                                                 default=TestInferVisualizationTypesEnum.default)

    test_image = relationship(InferenceTestImageModel, backref=backref('job', cascade='delete'))

    topology = relationship('TopologiesModel', uselist=False)

    device = relationship(DevicesModel, uselist=False)

    def __init__(self, data: dict):
        super().__init__(data)
        self.topology_id = data.get('topologyId')
        self.device_id = data.get('deviceId')

    def json(self) -> dict:
        return {
            'jobId': self.job_id,
            'type': self.job_type,
            'modelId': self.topology_id,
            'optimizedFromModelId': self.topology.optimized_from,
            'status': self.status_to_json(),
            'testImage': self.test_image.json()
        }
