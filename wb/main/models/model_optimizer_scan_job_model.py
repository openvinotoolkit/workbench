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

from sqlalchemy import Integer, Column, ForeignKey, Text
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel
from wb.main.models.topologies_model import ModelJobData


class ModelOptimizerScanJobModel(JobsModel):
    __tablename__ = 'model_optimizer_scan_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.model_optimizer_scan_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    topology_id = Column(Integer, ForeignKey('topologies.id'), nullable=False)
    information = Column(Text, nullable=True)

    model = relationship('TopologiesModel', foreign_keys=[topology_id],
                         backref=backref('mo_scan_job', uselist=False, lazy='subquery', cascade='delete,all'))

    def __init__(self, data: ModelJobData):
        super().__init__(data)
        self.topology_id = data['modelId']

    def json(self) -> dict:
        return {
            'topology_id': self.topology_id,
            'information': json.loads(self.information) if self.information else None,
        }

    def short_json(self):
        json_message = self.json()
        del json_message['topology_id']
        if 'intermediate' in json_message['information']:
            del json_message['information']['intermediate']
        return json_message
