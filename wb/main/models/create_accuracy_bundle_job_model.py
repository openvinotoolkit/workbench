"""
 OpenVINO DL Workbench
 Class for ORM model describing job for creating accuracy bundle

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
from sqlalchemy.orm import relationship

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel


class CreateAccuracyBundleJobModel(JobsModel):
    __tablename__ = 'create_accuracy_bundle_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.create_accuracy_bundle_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)

    bundle_id = Column(Integer, ForeignKey('downloadable_artifacts.id'), nullable=False)

    # Relationships
    bundle = relationship('DownloadableArtifactsModel', cascade='delete,all', uselist=False)

    def __init__(self, data: dict):
        super().__init__(data)
        self.bundle_id = data['bundleId']

    def json(self) -> dict:
        return {
            'jobId': self.job_id,
            'type': self.get_polymorphic_job_type(),
            'status': self.status_to_json(),
            'bundleId': self.bundle_id,
            'projectId': self.project_id
        }
