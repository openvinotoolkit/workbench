"""
 OpenVINO DL Workbench
 InferenceTestImageJobModel

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
