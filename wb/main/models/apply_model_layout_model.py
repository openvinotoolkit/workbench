"""
 OpenVINO DL Workbench
 Class for ORM model describing job for apply layout for the model

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

from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship, backref
from sqlalchemy.dialects.postgresql import JSON

from wb.main.enumerates import JobTypesEnum
from wb.main.models.topologies_model import TopologiesModel
from wb.main.models.jobs_model import JobsModel, JobData


class ApplyModelLayoutJobData(JobData):
    model_id: int
    layout: dict


class ApplyModelLayoutJobModel(JobsModel):
    __tablename__ = 'apply_model_layout_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.apply_model_layout.value
    }
    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)

    model_id = Column(Integer, ForeignKey(TopologiesModel.id), nullable=False)
    layout = Column(JSON, nullable=True)

    model = relationship(
        TopologiesModel, lazy='subquery',
        backref=backref(
            'apply_model_layout_jobs', cascade='all,delete-orphan',
            lazy='subquery', uselist=True
        ),
        uselist=False
    )

    def __init__(self, data: ApplyModelLayoutJobData):
        super().__init__(data)
        self.model_id = data['model_id']
        self.layout = data['layout']

    def json(self) -> dict:
        return {
            **super().json(),
            'modelId': self.model_id,
            'layout': self.layout,
        }
