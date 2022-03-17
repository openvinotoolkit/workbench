"""
 OpenVINO DL Workbench
 Class for ORM model for moving downloaded OMZ topology

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
import os

from sqlalchemy import Integer, Column, ForeignKey
from sqlalchemy.orm import relationship, backref
from wb.main.models.omz_topology_model import OMZTopologyModel
from wb.main.models.topologies_model import TopologiesModel
from wb.main.models.jobs_model import JobsModel, JobData
from wb.main.enumerates import JobTypesEnum

from config.constants import MODEL_DOWNLOADS_FOLDER


class OMZModelMoveJobData(JobData):
    modelId: int
    omzModelId: int


class OMZModelMoveJobModel(JobsModel):
    __tablename__ = 'omz_model_move_jobs'
    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.omz_model_move_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    omz_model_id = Column(Integer, ForeignKey(OMZTopologyModel.id), nullable=False)
    model_id = Column(Integer, ForeignKey(TopologiesModel.id), nullable=False)

    model: TopologiesModel = relationship(TopologiesModel, foreign_keys=[model_id],
                                          backref=backref('omz_model_move_job', lazy='subquery',
                                                          cascade='delete,all', uselist=False))
    omz_model: OMZTopologyModel = relationship(OMZTopologyModel, foreign_keys=[omz_model_id],
                                               backref=backref('omz_model_move_job', lazy='subquery',
                                                               cascade='delete,all', uselist=False))

    def __init__(self, data: OMZModelMoveJobData):
        super().__init__(data)
        self.model_id = data['modelId']
        self.omz_model_id = data['omzModelId']

    @property
    def source_path(self) -> str:
        return os.path.join(MODEL_DOWNLOADS_FOLDER, str(self.model.id), self.omz_model.path)

    @property
    def destination_path(self) -> str:
        return self.model.path
