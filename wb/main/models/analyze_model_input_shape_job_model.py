"""
 OpenVINO DL Workbench
 Class for ORM model described a job to analyze model input

 Copyright (c) 2021 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from wb.main.enumerates import JobTypesEnum
from wb.main.models.topologies_model import ModelJobData, TopologiesModel
from wb.main.models.jobs_model import JobsModel


class AnalyzeModelInputShapeJobModel(JobsModel):
    __tablename__ = 'analyze_model_input_shape_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.analyze_model_input_shape_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    model_id = Column(Integer, ForeignKey(TopologiesModel.id), nullable=True)

    model = relationship(TopologiesModel)

    def __init__(self, data: ModelJobData):
        super().__init__(data)
        self.model_id = data['modelId']

    def json(self):
        return {
            **(super().json()),
            'modelId': self.model_id,
        }
