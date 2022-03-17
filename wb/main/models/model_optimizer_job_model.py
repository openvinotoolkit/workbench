"""
 OpenVINO DL Workbench
 Class for ORM model described an Datasets

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
import json
from typing import Optional

from sqlalchemy import Integer, Column, ForeignKey, Text
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.model_optimizer.mo_arg_processor import MOArgProcessor
from wb.main.models.jobs_model import JobsModel, JobData


class ModelOptimizerJobData(JobData):
    resultModelId: int
    originalTopologyId: int
    moArgs: Optional[str]


class ModelOptimizerJobModel(JobsModel):
    __tablename__ = 'model_optimizer'
    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.model_optimizer_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    original_topology_id = Column(Integer, ForeignKey('topologies.id'), nullable=False)
    result_model_id = Column(Integer, ForeignKey('topologies.id'), nullable=False)
    mo_args = Column(Text, nullable=True)
    detailed_error_message = Column(Text, nullable=True)

    original_topology = relationship('TopologiesModel', foreign_keys=[original_topology_id],
                                     backref=backref('mo_jobs_from_original', lazy='subquery', cascade='delete,all'))
    model = relationship('TopologiesModel', foreign_keys=[result_model_id],
                         backref=backref('mo_jobs_from_result', lazy='subquery', cascade='delete,all'))

    def __init__(self, data: ModelOptimizerJobData):
        super().__init__(data)
        self.original_topology_id = data['originalTopologyId']
        self.result_model_id = data['resultModelId']
        if data['moArgs']:
            self.mo_args = json.dumps(data['moArgs'])

    def json(self):
        return {
            'original_topology_id': self.original_topology_id,
            'result_model_id': self.result_model_id,
            'mo_args': json.loads(self.mo_args) if self.mo_args else None,
        }

    def get_mo_args_for_tool(self, output_directory_path: str) -> dict:
        mo_args = json.loads(self.mo_args)
        original_topology = self.original_topology
        arg_processor = MOArgProcessor(self)
        arg_processor.process_file_args(job_id=self.job_id, mo_args=mo_args, topology=original_topology)
        arg_processor.add_misc_arguments(model_path=output_directory_path, mo_args=mo_args)
        return mo_args
