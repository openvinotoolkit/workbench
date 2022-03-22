"""
 OpenVINO DL Workbench
 Class for ORM model described a dataset generation config

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

from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel


class ModelDownloadConfigsModel(JobsModel):
    __tablename__ = 'model_downloads_configs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.download_model_type.value
    }
    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    model_id = Column(Integer, ForeignKey('topologies.id'))
    name = Column(String, nullable=True)
    tab_id = Column(String, nullable=True)

    model = relationship('TopologiesModel', backref=backref('download_configs', cascade='all,delete-orphan'))

    def __init__(self, data):
        super().__init__(data)
        self.model_id = data['model_id']
        self.name = data['name']
        self.tab_id = data['tab_id']

    def json(self):
        return {
            'jobId': self.job_id,
            'artifactId': self.shared_artifact.id,
            'status': self.pipeline.status_to_json(),
            'modelId': self.model_id,
            'tabId': self.tab_id,
            'name': self.name,
        }
