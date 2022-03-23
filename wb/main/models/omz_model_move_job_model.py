"""
 OpenVINO DL Workbench
 Class for ORM model for moving downloaded OMZ topology

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
