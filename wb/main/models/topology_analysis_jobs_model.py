"""
 OpenVINO DL Workbench
 Class for ORM model described a Model

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
import json

from sqlalchemy import Column, ForeignKey, Integer, Float, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY

from wb.main.enumerates import JobTypesEnum
from wb.main.models.topologies_model import ModelJobData
from wb.main.utils.utils import to_camel_case
from wb.main.models.jobs_model import JobsModel


class TopologyAnalysisJobsModel(JobsModel):
    __tablename__ = 'topology_analysis_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.model_analyzer_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    model_id = Column(Integer, ForeignKey('topologies.id'), nullable=False)
    batch = Column(Integer, default=1, nullable=False)
    g_flops = Column(Float, nullable=True)
    g_iops = Column(Float, nullable=True)
    maximum_memory = Column(Float, nullable=True)
    minimum_memory = Column(Float, nullable=True)
    m_params = Column(Float, nullable=True)
    sparsity = Column(Float, nullable=True)
    ir_version = Column(Text, nullable=True)
    is_obsolete = Column(Boolean, nullable=True)
    op_sets = Column(ARRAY(Text), nullable=True)
    topology_type = Column(Text, nullable=True)  # Expected to store TaskMethodEnum, but can contain something else.
    num_classes = Column(Integer, nullable=True)
    has_background = Column(Boolean, nullable=True)
    mo_params = Column(Text, nullable=True)
    has_batchnorm = Column(Boolean, nullable=True)
    is_int8 = Column(Boolean, nullable=True)
    topology_specific = Column(Text, nullable=True)
    outputs = Column(Text, nullable=True)
    inputs = Column(Text, nullable=True)

    model = relationship('TopologiesModel', back_populates='analysis_jobs')

    def __init__(self, data: ModelJobData):
        super().__init__(data)
        self.model_id = data['modelId']

    def json(self):
        return {
            'jobId': self.job_id,
            'type': self.job_type,
            'status': self.status_to_json(),
            'gFlops': self.g_flops,
            'gIops': self.g_iops,
            'maximumMemory': self.maximum_memory,
            'minimumMemory': self.minimum_memory,
            'mParams': self.m_params,
            'sparsity': self.sparsity,
            'irVersion': self.ir_version,
            'opSets': self.op_sets,
            'isObsolete': self.is_obsolete,
            'topologyType': self.topology_type,
            'numClasses': self.num_classes,
            'hasBackground': self.has_background,
            'moParams': self.get_mo_params_json() if self.mo_params else None,
            'hasBatchnorm': self.has_batchnorm,
            'isInt8': self.is_int8,
            'topologySpecific':
                json.loads(self.topology_specific) if self.topology_specific else None,
            'inputs': json.loads(self.inputs) if self.inputs else None,
            'outputs': json.loads(self.outputs) if self.outputs else None,
        }

    def get_mo_params_json(self) -> dict:
        res = {}
        for param_key, param_val in json.loads(self.mo_params).items():
            res[to_camel_case(param_key)] = param_val

        return res
